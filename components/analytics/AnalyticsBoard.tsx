import React from 'react'
import { View, StyleSheet, Dimensions } from 'react-native'
import Svg, { Path, Defs, LinearGradient, Stop, Circle, Text as SvgText } from 'react-native-svg'
import { Text } from '@/components/ui/Text'
import { ACCENT, TEXT_PRIMARY, TEXT_SECONDARY, SURFACE, SPACING_MD } from '@/lib/theme'
import { Ionicons } from '@expo/vector-icons'

const { width: SW } = Dimensions.get('window')
const CHART_WIDTH = SW - 80
const CHART_HEIGHT = 100

interface AnalyticsBoardProps {
    weeklyData: number[]
    bestHour: number
    totalMinutes: number
}

export default function AnalyticsBoard({ weeklyData, bestHour, totalMinutes }: AnalyticsBoardProps) {
    
    const maxVal = weeklyData.length > 0 ? Math.max(...weeklyData, 1) : 1;
    const points = weeklyData.length > 0 ? weeklyData.map((val, i) => {
        const x = (i / (weeklyData.length - 1)) * CHART_WIDTH;
        const y = CHART_HEIGHT - (val / maxVal) * (CHART_HEIGHT - 20);
        return { x, y };
    }) : [{ x: 0, y: CHART_HEIGHT }];
    const d = `M ${points.map(p => `${p.x},${p.y}`).join(' L ')}`;
    // Area path (handle single-point case gracefully)
    const areaD = points.length > 1 ? `${d} L ${points[points.length - 1].x},${CHART_HEIGHT} L 0,${CHART_HEIGHT} Z` : `${d} L 0,${CHART_HEIGHT} Z`;

    const formatHour = (h: number) => {
        if (h === 0) return '12 AM'
        if (h === 12) return '12 PM'
        return h > 12 ? `${h - 12} PM` : `${h} AM`
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.title}>Weekly Momentum</Text>
                    <Text style={styles.subtitle}>{totalMinutes}m focused this week</Text>
                </View>
                <View style={styles.hourBadge}>
                    <Ionicons name="time" size={14} color={ACCENT} />
                    <Text style={styles.hourText}>{formatHour(bestHour)} PEEK</Text>
                </View>
            </View>

            <View style={styles.chartWrapper}>
                <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
                    <Defs>
                        <LinearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                            <Stop offset="0" stopColor={ACCENT} stopOpacity="0.3" />
                            <Stop offset="1" stopColor={ACCENT} stopOpacity="0" />
                        </LinearGradient>
                    </Defs>
                    
                    {/* Area fill */}
                    <Path d={areaD} fill="url(#grad)" />
                    
                    {/* Line */}
                    <Path 
                        d={d} 
                        fill="none" 
                        stroke={ACCENT} 
                        strokeWidth="3" 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                    />

                    {/* Points */}
                    {points.map((p, i) => (
                        <Circle key={i} cx={p.x} cy={p.y} r="4" fill={SURFACE} stroke={ACCENT} strokeWidth="2" />
                    ))}
                </Svg>
            </View>

            <View style={styles.footer}>
                {['M','T','W','T','F','S','S'].map((day, i) => (
                    <Text key={i} style={styles.dayLabel}>{day}</Text>
                ))}
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: SURFACE,
        borderRadius: 28,
        padding: 24,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.03)',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 24,
    },
    title: {
        fontSize: 18,
        fontWeight: '800',
        color: TEXT_PRIMARY,
    },
    subtitle: {
        fontSize: 13,
        color: TEXT_SECONDARY,
        marginTop: 2,
    },
    hourBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(245,158,11,0.08)',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(245,158,11,0.1)',
    },
    hourText: {
        fontSize: 10,
        fontWeight: '900',
        color: ACCENT,
        letterSpacing: 0.5,
    },
    chartWrapper: {
        height: CHART_HEIGHT,
        alignItems: 'center',
        justifyContent: 'center',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 12,
        paddingHorizontal: 4,
    },
    dayLabel: {
        fontSize: 10,
        fontWeight: '800',
        color: 'rgba(255,255,255,0.2)',
        width: CHART_WIDTH / 7,
        textAlign: 'center',
    }
})
