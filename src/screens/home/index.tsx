import { ColorSwatch, Group } from '@mantine/core';
import { Button } from '@/components/ui/button';
import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import Draggable from 'react-draggable';
import { SWATCHES } from '@/constants';

interface GeneratedResult {
    expression: string;
    answer: string;
}

interface Response {
    expr: string;
    result: string;
    assign: boolean;
}

export default function Home() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const previewRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [color, setColor] = useState('rgb(255, 255, 255)');
    const [reset, setReset] = useState(false);
    const [dictOfVars, setDictOfVars] = useState({});
    const [result, setResult] = useState<GeneratedResult>();
    const [latexPosition, setLatexPosition] = useState({ x: 10, y: 200 });
    const [latexExpression, setLatexExpression] = useState<Array<string>>([]);
    const [tool, setTool] = useState<'draw' | 'erase' | 'rect' | 'circle' | 'line' | 'triangle'>('draw');
    const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);
    const [eraserSize, setEraserSize] = useState(10);

    useEffect(() => {
        if (latexExpression.length > 0 && window.MathJax) {
            setTimeout(() => {
                window.MathJax.Hub.Queue(['Typeset', window.MathJax.Hub]);
            }, 0);
        }
    }, [latexExpression]);

    useEffect(() => {
        if (result) {
            renderLatexToCanvas(result.expression, result.answer);
        }
    }, [result]);

    useEffect(() => {
        if (reset) {
            resetCanvas();
            setLatexExpression([]);
            setResult(undefined);
            setDictOfVars({});
            setReset(false);
        }
    }, [reset]);

    useEffect(() => {
        const canvas = canvasRef.current;
        const preview = previewRef.current;
        if (canvas && preview) {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            preview.width = window.innerWidth;
            preview.height = window.innerHeight;

            canvas.style.background = 'white';
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.lineCap = 'round';
                ctx.lineWidth = 3;
            }
        }

        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.9/MathJax.js?config=TeX-MML-AM_CHTML';
        script.async = true;
        document.head.appendChild(script);

        script.onload = () => {
            window.MathJax.Hub.Config({
                tex2jax: { inlineMath: [['$', '$'], ['\\(', '\\)']] },
            });
        };

        return () => {
            document.head.removeChild(script);
        };
    }, []);

    const renderLatexToCanvas = (expression: string, answer: string) => {
        const latex = `\\(\\LARGE{${expression} = ${answer}}\\)`;
        setLatexExpression([...latexExpression, latex]);

        const ctx = canvasRef.current?.getContext('2d');
        if (ctx && canvasRef.current) {
            ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        }
    };

    const resetCanvas = () => {
        const ctx = canvasRef.current?.getContext('2d');
        ctx?.clearRect(0, 0, canvasRef.current!.width, canvasRef.current!.height);

        const previewCtx = previewRef.current?.getContext('2d');
        previewCtx?.clearRect(0, 0, previewRef.current!.width, previewRef.current!.height);
    };

    const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const { offsetX, offsetY } = e.nativeEvent;
        const ctx = canvasRef.current?.getContext('2d');
        if (!ctx) return;

        if (tool === 'draw' || tool === 'erase') {
            ctx.beginPath();
            ctx.moveTo(offsetX, offsetY);
            ctx.lineWidth = tool === 'erase' ? eraserSize : 3;
            setIsDrawing(true);
        } else {
            setStartPos({ x: offsetX, y: offsetY });
        }
    };

    const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const { offsetX, offsetY } = e.nativeEvent;
        const ctx = canvasRef.current?.getContext('2d');
        const previewCtx = previewRef.current?.getContext('2d');

        if ((tool === 'draw' || tool === 'erase') && isDrawing && ctx) {
            ctx.strokeStyle = tool === 'erase' ? 'white' : color;
            ctx.lineTo(offsetX, offsetY);
            ctx.stroke();
            return;
        }

        if (startPos && previewCtx) {
            previewCtx.clearRect(0, 0, previewRef.current!.width, previewRef.current!.height);
            previewCtx.strokeStyle = color;
            previewCtx.lineWidth = 2;

            const dx = offsetX - startPos.x;
            const dy = offsetY - startPos.y;

            previewCtx.beginPath();
            if (tool === 'rect') {
                previewCtx.strokeRect(startPos.x, startPos.y, dx, dy);
            } else if (tool === 'circle') {
                const radius = Math.sqrt(dx * dx + dy * dy);
                previewCtx.arc(startPos.x, startPos.y, radius, 0, Math.PI * 2);
                previewCtx.stroke();
            } else if (tool === 'line') {
                previewCtx.moveTo(startPos.x, startPos.y);
                previewCtx.lineTo(offsetX, offsetY);
                previewCtx.stroke();
            } else if (tool === 'triangle') {
                previewCtx.moveTo(startPos.x, startPos.y);
                previewCtx.lineTo(offsetX, offsetY);
                previewCtx.lineTo(startPos.x - dx, offsetY);
                previewCtx.closePath();
                previewCtx.stroke();
            }
        }
    };

    const stopDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const ctx = canvasRef.current?.getContext('2d');
        const previewCtx = previewRef.current?.getContext('2d');
        if (!ctx) return;

        if (tool === 'rect' && startPos) {
            const { offsetX, offsetY } = e.nativeEvent;
            ctx.strokeStyle = color;
            ctx.strokeRect(startPos.x, startPos.y, offsetX - startPos.x, offsetY - startPos.y);
        } else if (tool === 'circle' && startPos) {
            const { offsetX, offsetY } = e.nativeEvent;
            const radius = Math.sqrt((offsetX - startPos.x) ** 2 + (offsetY - startPos.y) ** 2);
            ctx.beginPath();
            ctx.strokeStyle = color;
            ctx.arc(startPos.x, startPos.y, radius, 0, Math.PI * 2);
            ctx.stroke();
        } else if (tool === 'line' && startPos) {
            const { offsetX, offsetY } = e.nativeEvent;
            ctx.beginPath();
            ctx.moveTo(startPos.x, startPos.y);
            ctx.lineTo(offsetX, offsetY);
            ctx.strokeStyle = color;
            ctx.stroke();
        } else if (tool === 'triangle' && startPos) {
            const { offsetX, offsetY } = e.nativeEvent;
            ctx.beginPath();
            ctx.moveTo(startPos.x, startPos.y);
            ctx.lineTo(offsetX, offsetY);
            ctx.lineTo(startPos.x - (offsetX - startPos.x), offsetY);
            ctx.closePath();
            ctx.strokeStyle = color;
            ctx.stroke();
        }

        setIsDrawing(false);
        setStartPos(null);
        previewCtx?.clearRect(0, 0, previewRef.current!.width, previewRef.current!.height);
    };

    const runRoute = async () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const response = await axios.post(`${import.meta.env.VITE_API_URL}/calculate`, {
            image: canvas.toDataURL('image/png'),
            dict_of_vars: dictOfVars,
        });

        const resp = await response.data;
        resp.data.forEach((data: Response) => {
            if (data.assign) {
                setDictOfVars((prev) => ({ ...prev, [data.expr]: data.result }));
            }
        });

        const ctx = canvas.getContext('2d');
        const imageData = ctx!.getImageData(0, 0, canvas.width, canvas.height);
        let minX = canvas.width, minY = canvas.height, maxX = 0, maxY = 0;

        for (let y = 0; y < canvas.height; y++) {
            for (let x = 0; x < canvas.width; x++) {
                const i = (y * canvas.width + x) * 4;
                if (imageData.data[i + 3] > 0) {
                    minX = Math.min(minX, x);
                    minY = Math.min(minY, y);
                    maxX = Math.max(maxX, x);
                    maxY = Math.max(maxY, y);
                }
            }
        }

        setLatexPosition({ x: (minX + maxX) / 2, y: (minY + maxY) / 2 });

        resp.data.forEach((data: Response) => {
            setTimeout(() => {
                setResult({ expression: data.expr, answer: data.result });
            }, 1000);
        });
    };

    return (
        <>
            <div className="fixed top-0 left-0 w-full z-30 bg-white p-4 shadow-md flex items-center justify-between gap-4">
    <Button onClick={() => setReset(true)} className="bg-black text-white">
        Reset
    </Button>

    <Group className="flex gap-2">
        {SWATCHES.map((swatch) => (
            <ColorSwatch key={swatch} color={swatch} onClick={() => setColor(swatch)} />
        ))}
    </Group>

    <Button onClick={runRoute} className="bg-black text-white">
        Run
    </Button>

    <div className="flex gap-1">
        <Button
            onClick={() => setTool('draw')}
            className={tool === 'draw' ? 'bg-blue-500 text-white' : ''}
        >
            Pen
        </Button>
        <Button
            onClick={() => setTool('erase')}
            className={tool === 'erase' ? 'bg-blue-500 text-white' : ''}
        >
            Eraser
        </Button>
        <Button
            onClick={() => setTool('rect')}
            className={tool === 'rect' ? 'bg-blue-500 text-white' : ''}
        >
            Rect
        </Button>
        <Button
            onClick={() => setTool('circle')}
            className={tool === 'circle' ? 'bg-blue-500 text-white' : ''}
        >
            Circle
        </Button>
        <Button
            onClick={() => setTool('line')}
            className={tool === 'line' ? 'bg-blue-500 text-white' : ''}
        >
            Line
        </Button>
        <Button
            onClick={() => setTool('triangle')}
            className={tool === 'triangle' ? 'bg-blue-500 text-white' : ''}
        >
            Triangle
        </Button>
    </div>

    {tool === 'erase' && (
        <div className="flex items-center gap-2">
            <label htmlFor="eraser" className="text-sm text-gray-700">Eraser Size</label>
            <input
                id="eraser"
                type="range"
                min="1"
                max="50"
                value={eraserSize}
                onChange={(e) => setEraserSize(Number(e.target.value))}
                className="w-32"
            />
        </div>
    )}
</div>


            <canvas
                ref={canvasRef}
                id='canvas'
                className='absolute top-0 left-0 w-full h-full'
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseOut={stopDrawing}
            />
            <canvas
                ref={previewRef}
                className='absolute top-0 left-0 w-full h-full pointer-events-none'
            />

            {latexExpression &&
                latexExpression.map((latex, index) => (
                    <Draggable
                        key={index}
                        defaultPosition={latexPosition}
                        onStop={(e, data) => setLatexPosition({ x: data.x, y: data.y })}
                    >
                        <div className='absolute p-2 text-black rounded shadow-md'>
                            <div className='latex-content'>{latex}</div>
                        </div>
                    </Draggable>
                ))}
        </>
    );
}
