import { getBookingSettingByToken, createBooking, getAvailableTimeSlotsForBooking } from '@/server/actions/booking';
import { BookingPageClient } from '@/components/booking/booking-page-client';
import { notFound } from 'next/navigation';

export default async function BookingPage({ params }: { params: { token: string } }) {
    const { token } = params;

    const settingResult = await getBookingSettingByToken(token);
    if (!settingResult.success || !settingResult.setting) {
        notFound();
    }

    const setting = settingResult.setting;
    const availableDays = setting.availableDays ? JSON.parse(setting.availableDays) : [1, 2, 3, 4, 5];

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
            <div className="container mx-auto px-4 py-12 max-w-4xl">
                <BookingPageClient
                    setting={setting}
                    availableDays={availableDays}
                    createBooking={createBooking}
                    getAvailableTimeSlots={getAvailableTimeSlotsForBooking}
                    token={token}
                />
            </div>
        </div>
    );
}
