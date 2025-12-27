import React, { useMemo, useState, useEffect, useRef } from 'react';
import {
    ChartCanvas,
    Chart,
    CandlestickSeries,
    XAxis,
    YAxis,
    CrossHairCursor,
    MouseCoordinateX,
    MouseCoordinateY,
    discontinuousTimeScaleProviderBuilder,
} from 'react-financial-charts';
import { format } from 'd3-format';
import { timeFormat } from 'd3-time-format';

interface Ohlc {
    date: Date;
    open: number;
    high: number;
    low: number;
    close: number;
    volume?: number;
}

/* ---------- dummy data ---------- */
const buildData = (): Ohlc[] => {
    const days = 150; // More data for a better look
    const data: Ohlc[] = [];
    let value = 62000;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    for (let i = 0; i < days; i += 1) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        const open = value + (Math.random() - 0.5) * 800;
        const close = open + (Math.random() - 0.5) * 800;
        const high = Math.max(open, close) + Math.random() * 400;
        const low = Math.min(open, close) - Math.random() * 400;
        value = close;
        data.push({ date, open, high, low, close });
    }
    return data;
};

const margin = { left: 10, right: 70, top: 20, bottom: 40 };
const xScaleProvider = discontinuousTimeScaleProviderBuilder().inputDateAccessor(
    (d: Ohlc) => d.date,
);

/* ---------- component ---------- */
const CoordinatesChart: React.FC = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [size, setSize] = useState({ width: 0, height: 400 });
    const [colors, setColors] = useState({ up: '#22c55e', down: '#ef4444', foreground: '#ffffff' });
    const [ratio, setRatio] = useState(window.devicePixelRatio || 1);

    const rawData = useMemo(() => buildData(), []);
    const { data, xScale, xAccessor, displayXAccessor } = useMemo(() => xScaleProvider(rawData), [rawData]);

    // Stabilize initial xExtents
    const initialXExtents = useMemo(() => [
        xAccessor(data[data.length - 50]),
        xAccessor(data[data.length - 1])
    ], [data, xAccessor]);

    useEffect(() => {
        if (!containerRef.current) return;

        const updateSizeAndColors = () => {
            if (containerRef.current) {
                const style = getComputedStyle(document.documentElement);
                const foregroundHsl = style.getPropertyValue('--foreground').trim();
                setColors({
                    up: style.getPropertyValue('--chart-2').trim() || '#22c55e',
                    down: style.getPropertyValue('--destructive').trim() || '#ef4444',
                    foreground: foregroundHsl ? `hsl(${foregroundHsl})` : '#ffffff',
                });

                setSize({
                    width: containerRef.current.clientWidth,
                    height: 400,
                });

                setRatio(window.devicePixelRatio || 1);
            }
        };

        const resizeObserver = new ResizeObserver(updateSizeAndColors);
        resizeObserver.observe(containerRef.current);

        updateSizeAndColors();
        return () => resizeObserver.disconnect();
    }, []);

    if (size.width === 0) {
        return <div ref={containerRef} className="w-full h-[400px] bg-muted/5 animate-pulse rounded-lg" />;
    }

    return (
        <div ref={containerRef} className="w-full h-full min-h-[400px]">
            <ChartCanvas
                height={size.height}
                ratio={ratio}
                width={size.width}
                margin={margin}
                seriesName="COIN"
                data={data}
                xScale={xScale}
                xAccessor={xAccessor}
                displayXAccessor={displayXAccessor}
                xExtents={initialXExtents}
            >
                <Chart id={1} yExtents={(d: Ohlc) => [d.high, d.low]}>
                    <XAxis
                        axisAt="bottom"
                        orient="bottom"
                        tickLabelFill={colors.foreground}
                        showTicks
                        showTickLabel
                        fontSize={12}
                    />
                    <YAxis
                        axisAt="right"
                        orient="right"
                        ticks={5}
                        tickFormat={format(".2f")}
                        tickLabelFill={colors.foreground}
                        showTicks
                        showTickLabel
                        fontSize={12}
                    />
                    <MouseCoordinateX
                        displayFormat={timeFormat('%Y-%m-%d')}
                        at="bottom"
                        orient="bottom"
                        rectWidth={80}
                        fill="var(--popover)"
                        textFill="var(--popover-foreground)"
                    />
                    <MouseCoordinateY
                        displayFormat={format('.2f')}
                        at="right"
                        orient="right"
                        fill="var(--popover)"
                        textFill="var(--popover-foreground)"
                    />
                    <CandlestickSeries
                        fill={(d: Ohlc) => (d.close > d.open ? colors.up : colors.down)}
                        wickStroke={(d: Ohlc) => (d.close > d.open ? colors.up : colors.down)}
                        stroke={(d: Ohlc) => (d.close > d.open ? colors.up : colors.down)}
                    />
                    <CrossHairCursor strokeDasharray="Dash" />
                </Chart>
            </ChartCanvas>
        </div>
    );
};

export default CoordinatesChart;