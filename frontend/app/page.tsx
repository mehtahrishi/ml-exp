"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Play, CheckCircle, XCircle, Clock } from "lucide-react"
import { Modal } from "@/components/ui/modal"

type Run = {
  id: number
  name: string
  status: string
  metrics: { [key: string]: number } | null
  created_at: string
}

export default function Dashboard() {
  const [runs, setRuns] = useState<Run[]>([])
  const [activeTab, setActiveTab] = useState<"recent" | "comparison">("recent")
  const [comparisonMetric, setComparisonMetric] = useState<string>("final_accuracy")

  useEffect(() => {
    const fetchRuns = async () => {
      try {
        const res = await fetch("http://localhost:8000/runs/")
        const data = await res.json()
        setRuns(data.reverse()) // Newest first
      } catch (e) {
        console.error("Failed to fetch runs", e)
      }
    }
    fetchRuns()
    const interval = setInterval(fetchRuns, 5000)
    return () => clearInterval(interval)
  }, [])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed": return <CheckCircle className="h-5 w-5 text-green-500" />
      case "failed": return <XCircle className="h-5 w-5 text-red-500" />
      case "running": return <Play className="h-5 w-5 text-blue-500 animate-pulse" />
      default: return <Clock className="h-5 w-5 text-gray-500" />
    }
  }

  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <div className="min-h-screen bg-background p-8 dark:text-white">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
              Catalyst Flow ML
            </h1>
            <p className="text-muted-foreground mt-2">Track your experiments in real-time.</p>
          </div>
          <div className="flex gap-4">
            <button
              onClick={async () => {
                if (confirm("Are you sure you want to delete all run history?")) {
                  try {
                    await fetch("http://localhost:8000/clear_data", { method: "DELETE" })
                    setRuns([]) // Clear local state
                  } catch (e) {
                    alert("Failed to clear data")
                  }
                }
              }}
              className="px-4 py-2 rounded-md font-medium border border-red-500/50 text-red-500 hover:bg-red-500/10 transition flex items-center"
            >
              <XCircle className="mr-2 h-4 w-4" /> Clear History
            </button>
            <Link
              href="/new"
              className="bg-primary px-4 py-2 rounded-md font-medium hover:bg-primary/90 transition text-primary-foreground shadow-lg shadow-primary/20"
            >
              New Experiment
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          <Card className="border-border/40 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              {/* Tab Navigation */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex gap-2 p-1 bg-muted/50 rounded-lg">
                  <button
                    onClick={() => setActiveTab("recent")}
                    className={`px-6 py-2 rounded-md font-medium transition-all ${
                      activeTab === "recent"
                        ? "bg-primary text-primary-foreground shadow-md"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Recent Runs
                  </button>
                  <button
                    onClick={() => setActiveTab("comparison")}
                    className={`px-6 py-2 rounded-md font-medium transition-all ${
                      activeTab === "comparison"
                        ? "bg-primary text-primary-foreground shadow-md"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Comparison
                  </button>
                </div>

                {activeTab === "comparison" && (
                  <select
                    value={comparisonMetric}
                    onChange={(e) => setComparisonMetric(e.target.value)}
                    className="px-4 py-2 bg-background border border-border rounded-md text-sm focus:ring-2 focus:ring-primary outline-none"
                  >
                    <option value="final_accuracy">Final Accuracy</option>
                    <option value="validation_accuracy">Validation Accuracy</option>
                    <option value="final_loss">Final Loss</option>
                    <option value="f1_score">F1 Score</option>
                    <option value="precision">Precision</option>
                    <option value="recall">Recall</option>
                  </select>
                )}
              </div>

              <CardTitle>
                {activeTab === "recent" ? "Recent Runs" : "Experiment Comparison"}
              </CardTitle>
              <CardDescription>
                {activeTab === "recent"
                  ? "Real-time status of your training jobs"
                  : `Compare all experiments by ${comparisonMetric.replace(/_/g, " ")}`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Recent Runs Tab */}
              {activeTab === "recent" && (
                <div className="relative overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs uppercase text-muted-foreground border-b border-border">
                      <tr>
                        <th className="px-6 py-3">Status</th>
                        <th className="px-6 py-3">Run Name</th>
                        <th className="px-6 py-3">Created</th>
                        <th className="px-6 py-3">Metrics (Final)</th>
                        <th className="px-6 py-3">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {runs.map((run) => (
                        <tr key={run.id} className="hover:bg-muted/50 transition">
                          <td className="px-6 py-4">{getStatusIcon(run.status)}</td>
                          <td className="px-6 py-4 font-medium">{run.name}</td>
                          <td className="px-6 py-4">{new Date(run.created_at).toLocaleString()}</td>
                          <td className="px-6 py-4 font-mono text-xs">
                            {run.metrics ? JSON.stringify(run.metrics).slice(0, 50) + "..." : "-"}
                          </td>
                          <td className="px-6 py-4">
                            <Link href={`/runs/${run.id}`} className="text-blue-500 hover:underline">
                              View Details
                            </Link>
                          </td>
                        </tr>
                      ))}
                      {runs.length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                            No runs found. Start a training script to see data here.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Comparison Tab */}
              {activeTab === "comparison" && (
                <div className="space-y-4">
                  {runs.filter(r => r.status === "completed" && r.metrics).length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      No completed runs with metrics available for comparison.
                    </div>
                  ) : (
                    <div className="relative overflow-x-auto">
                      <table className="w-full text-sm text-left">
                        <thead className="text-xs uppercase text-muted-foreground border-b border-border">
                          <tr>
                            <th className="px-6 py-3">Rank</th>
                            <th className="px-6 py-3">Run Name</th>
                            <th className="px-6 py-3">Model/Config</th>
                            <th className="px-6 py-3">{comparisonMetric.replace(/_/g, " ")}</th>
                            <th className="px-6 py-3">All Metrics</th>
                            <th className="px-6 py-3">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {runs
                            .filter(r => r.status === "completed" && r.metrics)
                            .sort((a, b) => {
                              const aVal = a.metrics?.[comparisonMetric] ?? -Infinity
                              const bVal = b.metrics?.[comparisonMetric] ?? -Infinity
                              // Sort descending for accuracy/f1/precision/recall, ascending for loss
                              if (comparisonMetric.includes("loss")) {
                                return aVal - bVal
                              }
                              return bVal - aVal
                            })
                            .map((run, idx) => {
                              const metricValue = run.metrics?.[comparisonMetric]
                              const displayValue = metricValue !== undefined 
                                ? metricValue.toFixed(4)
                                : "N/A"
                              
                              // Medal colors for top 3
                              const rankBadge = idx === 0 
                                ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/50"
                                : idx === 1
                                ? "bg-gray-400/20 text-gray-300 border-gray-400/50"
                                : idx === 2
                                ? "bg-orange-600/20 text-orange-400 border-orange-600/50"
                                : "bg-muted/50 text-muted-foreground border-border"

                              return (
                                <tr key={run.id} className="hover:bg-muted/50 transition">
                                  <td className="px-6 py-4">
                                    <div className={`inline-flex items-center justify-center w-8 h-8 rounded-full border-2 font-bold ${rankBadge}`}>
                                      {idx + 1}
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 font-medium">{run.name}</td>
                                  <td className="px-6 py-4 text-xs text-muted-foreground">
                                    {new Date(run.created_at).toLocaleDateString()}
                                  </td>
                                  <td className="px-6 py-4">
                                    <span className="font-mono text-lg font-bold bg-primary/10 px-3 py-1 rounded">
                                      {displayValue}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 font-mono text-xs text-muted-foreground">
                                    {run.metrics ? (
                                      <div className="space-y-1">
                                        {Object.entries(run.metrics).slice(0, 2).map(([key, val]) => (
                                          <div key={key}>{key}: {(val as number).toFixed(3)}</div>
                                        ))}
                                      </div>
                                    ) : "-"}
                                  </td>
                                  <td className="px-6 py-4">
                                    <Link href={`/runs/${run.id}`} className="text-blue-500 hover:underline">
                                      View Details
                                    </Link>
                                  </td>
                                </tr>
                              )
                            })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Start a New Experiment"
      >
        <div className="space-y-4 text-sm text-muted-foreground">
          <p>
            To create a new experiment run, you need to execute a Python script that logs data to this dashboard.
          </p>
          <div className="bg-muted/50 p-4 rounded-md border border-border font-mono text-xs text-foreground overflow-x-auto">
            {`import requests

# 1. Start Run
requests.post("http://localhost:8000/runs/", json={
    "experiment_id": 1,
    "name": "My New Model",
    "parameters": {"lr": 0.01}
})`}
          </div>
          <p>
            Reference <code>backend/train_demo.py</code> for a full example with live metric logging.
          </p>
        </div>
      </Modal>
    </div>
  )
}
