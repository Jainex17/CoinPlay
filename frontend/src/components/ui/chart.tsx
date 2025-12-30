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
import { BarChart3 } from "lucide-react";

export interface Ohlc {
    date: Date;
    open: number;
    high: number;
    low: number;
    close: number;
    volume?: number;
}

const margin = { left: 10, right: 70, top: 20, bottom: 40 };
const xScaleProvider = discontinuousTimeScaleProviderBuilder().inputDateAccessor(
    (d: Ohlc) => d.date,
);


const CoordinatesChart: React.FC<{ data?: Ohlc[] }> = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [size, setSize] = useState({ width: 0, height: 400 });
    const [colors, setColors] = useState({ up: '#22c55e', down: '#ef4444', foreground: '#ffffff' });
    const [ratio, setRatio] = useState(window.devicePixelRatio || 1);

    const { data, xScale, xAccessor, displayXAccessor } = useMemo(() => xScaleProvider([]), []);

    // Stabilize initial xExtents
    const initialXExtents = useMemo(() => {
        if (data.length === 0) return [0, 0];
        if (data.length === 1) return [xAccessor(data[0]), xAccessor(data[0])];
        return [
            xAccessor(data[Math.max(0, data.length - 50)]),
            xAccessor(data[data.length - 1])
        ];
    }, [data, xAccessor]);

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
        <div ref={containerRef} className="w-full h-full min-h-[400px] relative">
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
            {(data.length === 0) && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/60 backdrop-blur-[2px] z-10">
                    <div className="flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-500">
                        <div className="p-4 rounded-full bg-muted/20 border border-border/50">
                            <BarChart3 className="w-10 h-10 text-muted-foreground/40" />
                        </div>
                        <div className="text-center">
                            <h4 className="text-lg font-black tracking-tight text-foreground/80">No Trade Data Yet</h4>
                            <p className="text-sm font-medium text-muted-foreground/60 max-w-[200px] mx-auto leading-relaxed">
                                Be the first one to start trading this coin!
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CoordinatesChart;