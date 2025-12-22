/**
 * 議事録のMarkdownからマインドマップ構造を抽出
 */

export interface MindMapNode {
    id: string;
    label: string;
    level: number;
    parentId?: string;
    children: MindMapNode[];
}

/**
 * Markdownテキストから見出し階層を抽出
 */
export function parseMarkdownToMindMap(markdown: string): MindMapNode[] {
    const lines = markdown.split('\n');
    const nodes: MindMapNode[] = [];
    const stack: { node: MindMapNode; level: number }[] = [];
    let nodeIdCounter = 0;

    for (const line of lines) {
        const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
        if (headingMatch) {
            const level = headingMatch[1].length;
            const text = headingMatch[2].trim();
            const nodeId = `node-${nodeIdCounter++}`;

            const node: MindMapNode = {
                id: nodeId,
                label: text,
                level,
                children: [],
            };

            // スタックから適切な親を見つける
            while (stack.length > 0 && stack[stack.length - 1].level >= level) {
                stack.pop();
            }

            if (stack.length > 0) {
                node.parentId = stack[stack.length - 1].node.id;
                stack[stack.length - 1].node.children.push(node);
            } else {
                nodes.push(node);
            }

            stack.push({ node, level });
        }
    }

    return nodes;
}

/**
 * マインドマップノードをフラットなリストに変換
 */
export function flattenMindMap(nodes: MindMapNode[]): MindMapNode[] {
    const result: MindMapNode[] = [];
    
    function traverse(node: MindMapNode) {
        result.push(node);
        node.children.forEach(child => traverse(child));
    }

    nodes.forEach(node => traverse(node));
    return result;
}
