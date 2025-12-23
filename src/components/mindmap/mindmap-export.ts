/**
 * マインドマップのエクスポート機能
 * PNG/SVG形式でのエクスポート
 */

import { MindMapNode } from '@/lib/mindmap-parser';

/**
 * SVG形式でマインドマップをエクスポート
 */
export function exportMindMapToSVG(nodes: MindMapNode[], title: string = 'Mind Map'): string {
    const width = 1200;
    const height = 800;
    const nodeWidth = 200;
    const nodeHeight = 60;
    const horizontalSpacing = 250;
    const verticalSpacing = 100;

    let svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">`;
    svg += `<defs><style>.node { fill: #00D4AA; stroke: #0D7377; stroke-width: 2; } .node-text { fill: white; font-family: sans-serif; font-size: 14px; } .link { stroke: #00D4AA; stroke-width: 2; fill: none; }</style></defs>`;

    // ノードの位置を計算
    const positions = new Map<string, { x: number; y: number }>();
    let currentY = 100;

    function calculatePositions(node: MindMapNode, x: number, y: number, level: number) {
        positions.set(node.id, { x, y });

        let childY = y;
        node.children.forEach((child, index) => {
            const childX = x + horizontalSpacing;
            const childYPos = childY + (index * verticalSpacing);
            calculatePositions(child, childX, childYPos, level + 1);
            childY = childYPos;
        });
    }

    // ルートノードから開始
    nodes.forEach((node, index) => {
        const startY = 100 + (index * 200);
        calculatePositions(node, 100, startY, 1);
    });

    // リンクを描画
    const linkElements: string[] = [];
    function drawLinks(node: MindMapNode) {
        const parentPos = positions.get(node.id);
        if (!parentPos) return;

        node.children.forEach(child => {
            const childPos = positions.get(child.id);
            if (childPos) {
                linkElements.push(
                    `<line x1="${parentPos.x + nodeWidth / 2}" y1="${parentPos.y}" x2="${childPos.x - nodeWidth / 2}" y2="${childPos.y}" class="link"/>`
                );
                drawLinks(child);
            }
        });
    }
    nodes.forEach(node => drawLinks(node));
    svg += linkElements.join('');

    // ノードを描画
    positions.forEach((pos, nodeId) => {
        const node = findNodeById(nodes, nodeId);
        if (node) {
            svg += `<rect x="${pos.x - nodeWidth / 2}" y="${pos.y - nodeHeight / 2}" width="${nodeWidth}" height="${nodeHeight}" rx="8" class="node"/>`;
            svg += `<text x="${pos.x}" y="${pos.y}" text-anchor="middle" dominant-baseline="middle" class="node-text">${escapeXml(node.label)}</text>`;
        }
    });

    svg += '</svg>';
    return svg;
}

function findNodeById(nodes: MindMapNode[], id: string): MindMapNode | null {
    for (const node of nodes) {
        if (node.id === id) return node;
        const found = findNodeInChildren(node, id);
        if (found) return found;
    }
    return null;
}

function findNodeInChildren(node: MindMapNode, id: string): MindMapNode | null {
    for (const child of node.children) {
        if (child.id === id) return child;
        const found = findNodeInChildren(child, id);
        if (found) return found;
    }
    return null;
}

function escapeXml(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

/**
 * Canvas APIを使用してPNG形式でエクスポート
 */
export async function exportMindMapToPNG(
    nodes: MindMapNode[],
    title: string = 'Mind Map'
): Promise<Blob> {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas context not available');

    canvas.width = 2400;
    canvas.height = 1600;

    // 背景
    ctx.fillStyle = '#0a0f0f';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // ノードの位置を計算
    const positions = new Map<string, { x: number; y: number }>();
    const nodeWidth = 200;
    const nodeHeight = 60;
    const horizontalSpacing = 300;
    const verticalSpacing = 120;

    function calculatePositions(node: MindMapNode, x: number, y: number) {
        positions.set(node.id, { x, y });
        let childY = y;
        node.children.forEach((child, index) => {
            const childX = x + horizontalSpacing;
            const childYPos = childY + (index * verticalSpacing);
            calculatePositions(child, childX, childYPos);
            childY = childYPos;
        });
    }

    nodes.forEach((node, index) => {
        const startY = 200 + (index * 300);
        calculatePositions(node, 200, startY);
    });

    // リンクを描画
    ctx.strokeStyle = '#00D4AA';
    ctx.lineWidth = 3;
    positions.forEach((pos, nodeId) => {
        const node = findNodeById(nodes, nodeId);
        if (node) {
            node.children.forEach(child => {
                const childPos = positions.get(child.id);
                if (childPos) {
                    ctx.beginPath();
                    ctx.moveTo(pos.x + nodeWidth / 2, pos.y);
                    ctx.lineTo(childPos.x - nodeWidth / 2, childPos.y);
                    ctx.stroke();
                }
            });
        }
    });

    // ノードを描画
    positions.forEach((pos, nodeId) => {
        const node = findNodeById(nodes, nodeId);
        if (node) {
            // ノードの背景
            ctx.fillStyle = node.level === 1 ? '#00D4AA' : '#1a2f2f';
            ctx.fillRect(
                pos.x - nodeWidth / 2,
                pos.y - nodeHeight / 2,
                nodeWidth,
                nodeHeight
            );

            // ノードのボーダー
            ctx.strokeStyle = '#00D4AA';
            ctx.lineWidth = 2;
            ctx.strokeRect(
                pos.x - nodeWidth / 2,
                pos.y - nodeHeight / 2,
                nodeWidth,
                nodeHeight
            );

            // テキスト
            ctx.fillStyle = '#ffffff';
            ctx.font = `${node.level === 1 ? 'bold' : 'normal'} 14px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(node.label, pos.x, pos.y);
        }
    });

    return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
            if (blob) {
                resolve(blob);
            } else {
                reject(new Error('Failed to create PNG blob'));
            }
        }, 'image/png');
    });
}
