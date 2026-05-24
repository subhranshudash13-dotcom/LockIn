import { View, StyleSheet, type ViewProps } from 'react-native'
import { SURFACE, BORDER, ACCENT } from '@/lib/theme'

interface CardProps extends ViewProps {
  /** Tighter padding */
  compact?: boolean
}

/**
 * Generic container card.
 * Use as a surface for list items, form sections, info panels, etc.
 */
export function Card({ compact, style, children, ...rest }: CardProps) {
  return (
    <View
      style={[
        styles.card,
        compact ? styles.compact : styles.normal,
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor:  SURFACE,
    borderRadius:     24,
    borderWidth:      1,
    borderColor:      'rgba(245,158,11,0.05)',
    // Subtle elevation/glow
    shadowColor:      ACCENT,
    shadowOffset:     { width: 0, height: 4 },
    shadowOpacity:    0.05,
    shadowRadius:     12,
  },
  normal:  { padding: 20 },
  compact: { padding: 12 },
})
