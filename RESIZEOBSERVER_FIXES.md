# ResizeObserver Loop Fixes

This document describes the fixes applied to resolve the "ResizeObserver loop completed with undelivered notifications" error.

## Root Causes Identified

### 1. Duplicate Chart Mounting (Primary Issue)
**File:** `src/components/dashboard/ChartActions.tsx`
**Problem:** The component rendered the same chart children twice:
- Once in the normal DOM position
- Once inside a Dialog portal when expanded

This created two `ResponsiveContainer` instances with separate `ResizeObserver` instances measuring different containers simultaneously, causing measurement loops.

**Fix:** Added state tracking to hide the original chart when the dialog is open:
```tsx
const [isExpanded, setIsExpanded] = useState(false);

// Hide original chart when expanded
<div style={{ display: isExpanded ? 'none' : 'block' }}>
  {children}
</div>
```

### 2. Oscillating CSS Dimensions
**File:** `src/components/ui/chart.tsx`
**Problem:** The `aspect-video` CSS class made height depend on width. When combined with `ResponsiveContainer`, this could cause oscillating dimensions as chart content affects container size.

**Fix:** Replaced `aspect-video` with stable `min-h-[300px]` to prevent dimension oscillation:
```tsx
// Before: "flex aspect-video justify-center..."
// After: "flex min-h-[300px] justify-center..."
```

### 3. D3 Map Layout Conflicts
**File:** `src/components/dashboard/EquatorialGuineaMapD3.tsx`
**Problem:** D3 was setting fixed `width` and `height` attributes while CSS was making the SVG responsive, causing layout conflicts.

**Fix:** Used `viewBox` and `preserveAspectRatio` for responsive scaling:
```tsx
// Before: .attr("width", width).attr("height", height)
// After: .attr("viewBox", `0 0 ${width} ${height}`).attr("preserveAspectRatio", "xMidYMid meet")
```

### 4. Unstable Chart Container Sizing
**File:** `src/components/dashboard/DashboardCharts.tsx`
**Problem:** Chart containers lacked stable minimum dimensions, allowing rapid size changes.

**Fix:** Added stable container wrappers with minimum heights:
```tsx
<div className="min-h-[300px]">
  <ResponsiveContainer width="100%" height={300}>
    {/* Chart content */}
  </ResponsiveContainer>
</div>
```

## Prevention Measures Implemented

### 1. Global Error Handling
**File:** `src/utils/resizeObserverHandler.ts`
- Suppresses console spam from ResizeObserver loop warnings after first few occurrences
- Provides debounced ResizeObserver class for future use
- Logs useful debugging information

### 2. Development Testing
**File:** `src/components/dashboard/ResizeObserverTestIndicator.tsx`
- Visual indicator that monitors for ResizeObserver errors during development
- Shows error count and timing in bottom-right corner
- Only visible in development mode

### 3. Stable Chart Container Utility
**File:** `src/components/ui/stable-chart-container.tsx`
- Reusable container component for charts that prevents ResizeObserver loops
- Includes debounced resize handling
- Maintains stable dimensions and aspect ratios

## Usage Guidelines

### For New Chart Components:
1. Always wrap `ResponsiveContainer` in a stable container with minimum height
2. Avoid using `aspect-*` CSS classes with charts
3. Use the `StableChartContainer` utility for complex charts
4. Never render the same chart component in multiple places simultaneously

### For Dialog/Modal Charts:
1. Hide the original chart when showing an expanded version
2. Use state to control which instance is visible
3. Prefer rendering separate chart instances for different contexts

### For D3 Components:
1. Use `viewBox` and `preserveAspectRatio` instead of fixed dimensions
2. Avoid mixing JavaScript-controlled sizes with responsive CSS
3. Set stable container dimensions in the parent component

## Files Modified

### Core Fixes:
- `src/components/dashboard/ChartActions.tsx` - Fixed duplicate mounting
- `src/components/ui/chart.tsx` - Removed oscillating CSS
- `src/components/dashboard/DashboardCharts.tsx` - Added stable containers
- `src/components/dashboard/EquatorialGuineaMapD3.tsx` - Fixed D3 responsive scaling

### Error Handling:
- `src/utils/resizeObserverHandler.ts` - Global error suppression
- `src/App.tsx` - Initialize error handling

### Development Tools:
- `src/components/dashboard/ResizeObserverTestIndicator.tsx` - Error monitoring
- `src/pages/Dashboard.tsx` - Added test indicator
- `src/components/ui/stable-chart-container.tsx` - Prevention utility

## Testing

The fixes have been tested by:
1. Loading the dashboard with multiple charts
2. Expanding charts in dialogs
3. Monitoring console for ResizeObserver errors
4. Using the visual test indicator

**Result:** No ResizeObserver loop errors detected after implementing these fixes.

## Best Practices

1. **Single Chart Instance Rule:** Never mount the same chart component in multiple places simultaneously
2. **Stable Sizing:** Always provide minimum dimensions for chart containers
3. **Avoid Layout Coupling:** Don't use CSS that makes dimensions interdependent with chart content
4. **Debounce Resize Events:** Use timeouts when handling resize events manually
5. **Test in Development:** Use the test indicator to verify charts don't cause loops

## Migration Guide

For existing chart components experiencing ResizeObserver issues:

1. Wrap `ResponsiveContainer` in a div with `min-h-[300px]` or similar
2. If using dialogs, implement hide/show logic instead of dual mounting
3. Replace `aspect-*` classes with fixed minimum heights
4. For D3, switch to viewBox-based responsive scaling

## Future Maintenance

- Monitor the console for new ResizeObserver warnings
- Use the `StableChartContainer` utility for new chart components
- Test chart resizing behavior when adding new responsive features
- Keep the error handler utility updated for new ResizeObserver APIs
