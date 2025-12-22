import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import { db } from "@/db"
import { users } from "@/db/schema"
import { eq } from "drizzle-orm"

export const { handlers, signIn, signOut, auth } = NextAuth({
    providers: [
        Google({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        }),
    ],
    pages: {
        signIn: '/login',
    },
    callbacks: {
        authorized: async ({ auth }) => {
            // Logged in users are authenticated, otherwise redirect to login
            return !!auth
        },
        signIn: async ({ user, account, profile }) => {
            if (!user.email) {
                return false;
            }

            try {
                // Googleプロバイダーの場合、profile.subがユーザーID
                const userId = (profile as any)?.sub || account?.providerAccountId || user.id;
                
                if (!userId) {
                    console.error('No user ID found');
                    return false;
                }

                // ユーザーが存在するか確認（emailで検索）
                const existingUser = await db.query.users.findFirst({
                    where: eq(users.email, user.email),
                });

                // ユーザーが存在しない場合は作成
                if (!existingUser) {
                    await db.insert(users).values({
                        id: userId,
                        name: user.name || user.email.split('@')[0],
                        email: user.email,
                        emailVerified: 1, // true
                        image: user.image || null,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    });
                } else if (existingUser.id !== userId) {
                    // IDが異なる場合は更新（既存ユーザーのIDを保持）
                    await db.update(users)
                        .set({
                            name: user.name || existingUser.name,
                            image: user.image || existingUser.image,
                            updatedAt: new Date(),
                        })
                        .where(eq(users.id, existingUser.id));
                } else {
                    // 既存ユーザーの情報を更新
                    await db.update(users)
                        .set({
                            name: user.name || existingUser.name,
                            image: user.image || existingUser.image,
                            updatedAt: new Date(),
                        })
                        .where(eq(users.id, userId));
                }

                return true;
            } catch (error) {
                console.error('Error creating/updating user:', error);
                return false;
            }
        },
        session: async ({ session, token }) => {
            if (session?.user && token?.sub) {
                session.user.id = token.sub;
            }
            return session;
        },
        jwt: async ({ token, user, account, profile }) => {
            if (user) {
                // Googleプロバイダーの場合、profile.subがユーザーID
                const userId = (profile as any)?.sub || account?.providerAccountId || user.id;
                token.sub = userId;
            }
            return token;
        },
    },
})
