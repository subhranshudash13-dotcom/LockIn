import React from 'react'
import Svg, { Path, Defs, LinearGradient, Stop, Circle, G } from 'react-native-svg'

interface BrandLogoProps {
    size?: number
    color?: string
}

export function BrandLogo({ size = 42, color = '#F59E0B' }: BrandLogoProps) {
    return (
        <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
            <Defs>
                <LinearGradient id="goldGrad" x1="0" y1="0" x2="100" y2="100">
                    <Stop offset="0%" stopColor="#FDE68A" stopOpacity="1" />
                    <Stop offset="40%" stopColor="#F59E0B" stopOpacity="1" />
                    <Stop offset="60%" stopColor="#D97706" stopOpacity="1" />
                    <Stop offset="100%" stopColor="#78350F" stopOpacity="1" />
                </LinearGradient>
                <LinearGradient id="obsidianGrad" x1="0" y1="0" x2="0" y2="100">
                    <Stop offset="0%" stopColor="#1C1917" />
                    <Stop offset="45%" stopColor="#0C0A09" />
                    <Stop offset="100%" stopColor="#000000" />
                </LinearGradient>
                <LinearGradient id="glintGrad" x1="0" y1="0" x2="1" y2="1">
                    <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.4" />
                    <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
                </LinearGradient>
            </Defs>

            {/* Orbital Halo */}
            <Circle 
                cx="50" cy="50" r="46" 
                stroke="url(#goldGrad)" 
                strokeWidth="0.5" 
                strokeDasharray="4 8"
                opacity="0.3"
            />

            {/* 3D Base Shadow */}
            <Path
                d="M32 48H68V82C68 84.76 65.76 87 63 87H37C34.24 87 32 84.76 32 82V48Z"
                fill="#000"
                opacity="0.4"
            />
            
            {/* Padlock Body (Obsidian) */}
            <Path
                d="M30 45H70V80C70 82.76 67.76 85 65 85H35C32.24 85 30 82.76 30 80V45Z"
                fill="url(#obsidianGrad)"
                stroke="rgba(245,158,11,0.2)"
                strokeWidth="1"
            />

            {/* Premium Gold Accent Border (Right Side for 3D) */}
            <Path
                d="M70 45V80C70 82.76 67.76 85 65 85H64V45H70Z"
                fill="url(#goldGrad)"
                opacity="0.2"
            />
            
            {/* Shackle Shadow */}
            <Path
                d="M42 45V37C42 31.48 45.48 27 51 27C56.52 27 61 31.48 61 37V45"
                stroke="#000"
                strokeWidth="6"
                strokeLinecap="round"
                opacity="0.5"
            />

            {/* Padlock Shackle (Gold) */}
            <Path
                d="M40 45V35C40 29.48 44.48 25 50 25C55.52 25 60 29.48 60 35V45"
                stroke="url(#goldGrad)"
                strokeWidth="6"
                strokeLinecap="round"
            />

            {/* Inner Glint Streak */}
            <Path
                d="M35 45L55 85"
                stroke="url(#glintGrad)"
                strokeWidth="8"
                opacity="0.1"
            />
            
            {/* Center Core (Glowing Keyhole) */}
            <G opacity="0.9">
                <Circle cx="50" cy="65" r="7" fill="#000" />
                <Circle cx="50" cy="65" r="4" fill="url(#goldGrad)" />
                <Path
                    d="M50 69V74"
                    stroke="url(#goldGrad)"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                />
            </G>

            {/* Micro Glint */}
            <Circle cx="35" cy="50" r="1.5" fill="#fff" opacity="0.3" />
        </Svg>
    )
}
