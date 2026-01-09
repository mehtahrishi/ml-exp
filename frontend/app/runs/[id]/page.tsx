"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ArrowLeft, Clock, Tag } from "lucide-react"
import Link from "next/link"

type Metric = {
    name: string
    value: number
    step: number
    timestamp: string
}

type RunDetails = {
    id: number
    name: string
    status: string
    parameters: { [key: string]: any }
    tags: string[]
    created_at: string
}

export default function RunDetailsPage() {
    const params = useParams()
    const id = params.id
    const [run, setRun] = useState<RunDetails | null>(null)
    const [metrics, setMetrics] = useState<Metric[]>([])

    // Group metrics by name for charting
    // e.g. { accuracy: [{step: 1, value: 0.5}], loss: [...] }
    const [chartData, setChartData] = useState<{ [key: string]: any[] }>({})

    const fetchData = async () => {
        try {
            if (!id) return

            const runRes = await fetch(`http://localhost:8000/runs/${id}`)
            if (runRes.ok) {
                setRun(await runRes.json())
            }

            const metricRes = await fetch(`http://localhost:8000/runs/${id}/metrics`)
            if (metricRes.ok) {
                const data: Metric[] = await metricRes.json()
                setMetrics(data)

                // Process for Recharts
                // We want to Group by Category now
                // Category -> [ {step, train_val, test_val, f1} ]

                const stepsMap: { [key: number]: any } = {}

                // Helper to get category
                const getCategory = (name: string) => {
                    if (name.includes("accuracy")) return "Accuracy (Train vs Test)"
                    if (name.includes("loss")) return "Loss (Log Loss)"
                    return "Performance Metrics" // F1, Precision, etc
                }

                data.forEach(m => {
                    if (!stepsMap[m.step]) stepsMap[m.step] = { step: m.step }
                    stepsMap[m.step][m.name] = m.value
                })

                // Convert to arrays per category
                const categories = ["Accuracy (Train vs Test)", "Loss (Log Loss)", "Performance Metrics"]
                const finalCharts: { [key: string]: any[] } = {}

                categories.forEach(cat => {
                    const chartData = Object.values(stepsMap).sort((a: any, b: any) => a.step - b.step)
                    // Only add if this category has data
                    const hasData = chartData.some(d => {
                        if (cat.includes("Accuracy")) return d.train_accuracy || d.test_accuracy
                        if (cat.includes("Loss")) return d.train_loss || d.test_loss
                        return d.f1_score || d.precision || d.recall
                    })
                    if (hasData) finalCharts[cat] = chartData
                })

                setChartData(finalCharts)
            }
        } catch (e) {
            console.error(e)
        }
    }

    useEffect(() => {
        fetchData()
        const interval = setInterval(fetchData, 2000) // Poll every 2s for live updates
        return () => clearInterval(interval)
    }, [id])

    if (!run) return <div className="p-8 text-white">Loading...</div>

    return (
        <div className="min-h-screen bg-background p-8 dark:text-white">
            <div className="max-w-7xl mx-auto space-y-6">
                <Link href="/" className="flex items-center text-muted-foreground hover:text-white transition">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
                </Link>

                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-bold">{run.name}</h1>
                        <div className="flex items-center mt-2 space-x-4">
                            <span className={`px-2 py-0.5 rounded text-xs font-medium uppercase tracking-wide 
                            ${run.status === 'completed' ? 'bg-green-500/20 text-green-500' : 'bg-blue-500/20 text-blue-500'}`}>
                                {run.status}
                            </span>
                            <span className="flex items-center text-sm text-muted-foreground">
                                <Clock className="mr-1 h-3 w-3" /> {new Date(run.created_at).toLocaleString()}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Parameters Card */}
                    <Card className="md:col-span-1 bg-card/50">
                        <CardHeader>
                            <CardTitle>Parameters</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {Object.entries(run.parameters || {}).map(([key, val]) => (
                                    <div key={key} className="flex justify-between text-sm border-b border-border/50 pb-2">
                                        <span className="text-muted-foreground">{key}</span>
                                        <span className="font-mono">{String(val)}</span>
                                    </div>
                                ))}
                                {(!run.parameters || Object.keys(run.parameters).length === 0) && (
                                    <div className="text-sm text-muted-foreground">No parameters logged</div>
                                )}
                            </div>
                            <div className="mt-6">
                                <h4 className="font-semibold mb-2 flex items-center"><Tag className="w-4 h-4 mr-2" /> Tags</h4>
                                <div className="flex flex-wrap gap-2">
                                    {run.tags.map(tag => (
                                        <span key={tag} className="bg-secondary px-2 py-1 rounded text-xs text-secondary-foreground">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Charts Area */}
                    <div className="md:col-span-2 space-y-6">
                        {Object.keys(chartData).length === 0 && (
                            <Card className="bg-card/50 h-64 flex items-center justify-center text-muted-foreground">
                                Waiting for metrics...
                            </Card>
                        )}

                        {Object.entries(chartData).map(([category, data]) => {
                            // Determine which lines to draw based on category
                            const isAcc = category.includes("Accuracy")
                            const isLoss = category.includes("Loss")

                            return (
                                <Card key={category} className="bg-card/50">
                                    <CardHeader>
                                        <CardTitle>{category}</CardTitle>
                                    </CardHeader>
                                    <CardContent className="h-[300px] w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart data={data}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                                                <XAxis dataKey="step" stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                                                <YAxis stroke="#888" fontSize={12} tickLine={false} axisLine={false} domain={['auto', 'auto']} />
                                                <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }} itemStyle={{ color: '#fff' }} />
                                                <Legend verticalAlign="top" height={36} />

                                                {isAcc && (
                                                    <>
                                                        <Line name="Test Accuracy" type="monotone" dataKey="test_accuracy" stroke="#3b82f6" strokeWidth={2} dot={false} activeDot={{ r: 6 }} />
                                                        <Line name="Train Accuracy" type="monotone" dataKey="train_accuracy" stroke="#f97316" strokeWidth={2} dot={false} strokeDasharray="5 5" />
                                                    </>
                                                )}

                                                {isLoss && (
                                                    <>
                                                        <Line name="Test Loss" type="monotone" dataKey="test_loss" stroke="#ef4444" strokeWidth={2} dot={false} />
                                                        <Line name="Train Loss" type="monotone" dataKey="train_loss" stroke="#eab308" strokeWidth={2} dot={false} strokeDasharray="5 5" />
                                                    </>
                                                )}

                                                {!isAcc && !isLoss && (
                                                    <>
                                                        <Line name="F1 Score (Harmony)" type="monotone" dataKey="f1_score" stroke="#8b5cf6" strokeWidth={2} dot={false} />
                                                        <Line name="Precision (Quality/Pickiness)" type="monotone" dataKey="precision" stroke="#ec4899" strokeWidth={2} dot={false} strokeDasharray="3 3" />
                                                        <Line name="Recall (Quantity/Coverage)" type="monotone" dataKey="recall" stroke="#14b8a6" strokeWidth={2} dot={false} strokeDasharray="3 3" />
                                                    </>
                                                )}

                                            </LineChart>
                                        </ResponsiveContainer>
                                    </CardContent>
                                </Card>
                            )
                        })}
                    </div>
                </div>
            </div>
        </div>
    )
}
