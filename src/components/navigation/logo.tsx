'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';

export function Logo({ className = 'w-10 h-10' }: { className?: string }) {
    const [hasError, setHasError] = useState(false);
    const [imageUrl, setImageUrl] = useState<string | null>(null);

    useEffect(() => {
        // Canvas APIで白背景を透過処理
        const processImage = async () => {
            try {
                const img = new window.Image();
                img.crossOrigin = 'anonymous';
                
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    canvas.width = img.width;
                    canvas.height = img.height;
                    const ctx = canvas.getContext('2d', { willReadFrequently: true });
                    
                    if (!ctx) {
                        setImageUrl('/logo-horizontal.png');
                        return;
                    }
                    
                    ctx.drawImage(img, 0, 0);
                    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    const data = imageData.data;
                    
                    // 白背景を透過（より厳密な閾値）
                    for (let i = 0; i < data.length; i += 4) {
                        const r = data[i];
                        const g = data[i + 1];
                        const b = data[i + 2];
                        
                        // 白に近い色（閾値: 250以上）を透過
                        if (r >= 250 && g >= 250 && b >= 250) {
                            data[i + 3] = 0; // アルファを0に
                        }
                    }
                    
                    ctx.putImageData(imageData, 0, 0);
                    const processedUrl = canvas.toDataURL('image/png');
                    setImageUrl(processedUrl);
                };
                
                img.onerror = () => {
                    setImageUrl('/logo-horizontal.png');
                };
                
                img.src = '/logo-horizontal.png';
            } catch (error) {
                console.error('Image processing failed:', error);
                setImageUrl('/logo-horizontal.png');
            }
        };
        
        processImage();
    }, []);

    if (hasError) {
        return null;
    }

    return (
        <div className={`relative ${className} flex-shrink-0`}>
            {imageUrl ? (
                <Image
                    src={imageUrl}
                    alt="Actory"
                    fill
                    className="object-contain"
                    priority
                    unoptimized
                    onError={() => setHasError(true)}
                />
            ) : (
                <Image
                    src="/logo-horizontal.png"
                    alt="Actory"
                    fill
                    className="object-contain"
                    priority
                    unoptimized
                    style={{ mixBlendMode: 'multiply', filter: 'contrast(1.1) brightness(1.05)' }}
                    onError={() => setHasError(true)}
                />
            )}
        </div>
    );
}

