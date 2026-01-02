import { useEffect, useRef } from 'react';
import { createChart, ColorType, AreaSeries } from 'lightweight-charts';
import type { IChartApi, ISeriesApi, AreaData, Time } from 'lightweight-charts';
import { BarChart3 } from "lucide-react";

export interface PricePoint {
    time: string;
    value: number;
}

interface PriceChartProps {
    data: PricePoint[];
    height?: number;
}

const PriceChart: React.FC<PriceChartProps> = ({ data, height = 400 }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<IChartApi | null>(null);
    const seriesRef = useRef<ISeriesApi<'Area'> | null>(null);

    useEffect(() => {
        if (!containerRef.current || data.length === 0) return;

        const firstPrice = data[0]?.value ?? 0;
        const lastPrice = data[data.length - 1]?.value ?? 0;
        const isPositive = lastPrice >= firstPrice;

        const lineColor = isPositive ? '#22c55e' : '#ef4444';
        const topColor = isPositive ? 'rgba(34, 197, 94, 0.4)' : 'rgba(239, 68, 68, 0.4)';
        const bottomColor = isPositive ? 'rgba(34, 197, 94, 0.0)' : 'rgba(239, 68, 68, 0.0)';

        const chart = createChart(containerRef.current, {
            layout: {
                background: { type: ColorType.Solid, color: 'transparent' },
                textColor: '#888888',
                fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
            },
            grid: {
                vertLines: { color: 'rgba(255, 255, 255, 0.05)' },
                horzLines: { color: 'rgba(255, 255, 255, 0.05)' },
            },
            width: containerRef.current.clientWidth,
            height: height,
            rightPriceScale: {
                borderVisible: false,
                scaleMargins: {
                    top: 0.1,
                    bottom: 0.1,
                },
            },
            timeScale: {
                borderVisible: false,
                timeVisible: true,
                secondsVisible: false,
            },
            crosshair: {
                vertLine: {
                    color: 'rgba(255, 255, 255, 0.2)',
                    width: 1,
                    style: 3,
                    labelBackgroundColor: '#1f1f1f',
                },
                horzLine: {
                    color: 'rgba(255, 255, 255, 0.2)',
                    width: 1,
                    style: 3,
                    labelBackgroundColor: '#1f1f1f',
                },
            },
            handleScale: {
                axisPressedMouseMove: true,
            },
            handleScroll: {
                vertTouchDrag: false,
            },
        });

        const areaSeries = chart.addSeries(AreaSeries, {
            lineColor: lineColor,
            topColor: topColor,
            bottomColor: bottomColor,
            lineWidth: 2,
            priceFormat: {
                type: 'custom',
                formatter: (price: number) => {
                    if (price === 0) return '0';
                    if (price < 0.000001) return price.toExponential(2);
                    if (price < 0.0001) return price.toFixed(8);
                    if (price < 0.01) return price.toFixed(6);
                    if (price < 1) return price.toFixed(4);
                    return price.toFixed(2);
                },
            },
            crosshairMarkerRadius: 5,
            crosshairMarkerBorderColor: lineColor,
            crosshairMarkerBackgroundColor: '#ffffff',
        });

        const formattedData: AreaData<Time>[] = data.map((point) => ({
            time: (new Date(point.time).getTime() / 1000) as Time,
            value: point.value,
        }));

        areaSeries.setData(formattedData);
        chart.timeScale().fitContent();

        chartRef.current = chart;
        seriesRef.current = areaSeries;

        const handleResize = () => {
            if (containerRef.current && chartRef.current) {
                chartRef.current.applyOptions({
                    width: containerRef.current.clientWidth,
                });
            }
        };

        const resizeObserver = new ResizeObserver(handleResize);
        resizeObserver.observe(containerRef.current);

        const removeAttribution = () => {
            if (containerRef.current) {
                const links = containerRef.current.querySelectorAll('a');
                links.forEach(link => link.remove());
            }
        };
        removeAttribution();
        const timeoutId = setTimeout(removeAttribution, 100);

        return () => {
            clearTimeout(timeoutId);
            resizeObserver.disconnect();
            chart.remove();
        };
    }, [data, height]);

    if (data.length === 0) {
        return (
            <div
                ref={containerRef}
                className="w-full relative flex items-center justify-center bg-background"
                style={{ height: `${height}px` }}
            >
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
        );
    }

    return (
        <div
            ref={containerRef}
            className="w-full [&_a]:hidden [&_[class*='attribution']]:hidden"
            style={{ height: `${height}px` }}
        />
    );
};

export default PriceChart;
