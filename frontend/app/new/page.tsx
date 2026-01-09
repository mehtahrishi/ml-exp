"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ArrowLeft, Upload, Server, Play, Check } from "lucide-react"
import Link from "next/link"
import axios from "axios"
import { cn } from "@/lib/utils"

const MODELS = [
    "RandomForest",
    "LogisticRegression",
    "MLPClassifier",
    "SVM",
    "GradientBoosting",
    "DecisionTree",
    "KNN",
    "NaiveBayes",
    "AdaBoost"
]

const getProcessFlow = (modelName: string) => {
    const isTreeEnsemble = ["RandomForest", "GradientBoosting", "AdaBoost"].includes(modelName)
    const isNeuralNet = ["MLPClassifier"].includes(modelName)

    let step2Tech = "We retrain fresh models on larger subsets of the Training Set (Learning Curve Strategy). This visualizes how more data improves generalization."
    let step2Kitchen = "Cooking: We put the ingredients in the pan. We let it simmer, stirring constantly to mix the flavors. Adding more ingredients (Data) helps."

    if (isTreeEnsemble) {
        step2Tech = "We iteratively add more Estimators (Trees) to the model. We start with 5 trees and grow to 100, refining the decision boundary."
        step2Kitchen = "Recruiting: We don't just cook one dish. We hire more chefs! We start with 5 chefs voting on the flavor, and keep hiring until we have 100."
    } else if (isNeuralNet) {
        step2Tech = "Epochs: The network passes the SAME data through layers multiple times (Forward/Backward pass), adjusting weights to minimize loss."
        step2Kitchen = "Simmering & Reducing: We don't add ingredients or chefs. We just keep 'working' the sauce. The longer it simmers (Epochs), the richer the flavor."
    } else if (modelName === "SVM") {
        step2Tech = "Margin Maximization: We retrain on increasing data subsets. The model recalculates the optimal hyperplane to maximize the distance (Margin) between classes."
        step2Kitchen = "The Ruler: The Chef doesn't just want to separate the foods; they want a 'Safety Gap'. As we add more plates, they adjust the divider to keep the widest possible empty space between the Salty and Sweet piles."
    } else if (modelName === "GradientBoosting") {
        step2Tech = "Sequential Boosting: We add trees sequentially. Each new tree focuses specifically on correcting the errors (residuals) made by the previous combined trees."
        step2Kitchen = "The Line Cook Assembly: Code doesn't just hire chefs. It hires a Specialist. Chef 1 cooks. Chef 2 tastes it and fixes the salt. Chef 3 tastes that and fixes the acid. Together they make a perfect dish."
    } else if (modelName === "DecisionTree") {
        step2Tech = "Tree Growth: We retrain fresh trees on larger subsets of data. As data increases, the tree discovers more complex splitting rules (Nodes)."
        step2Kitchen = "Writing the Recipe: We start with a simple rule ('Is it Sweet?'). As we see more ingredients (Data), we add more specific steps ('Is it Sweet AND Red AND Crunchy?'). The recipe gets more detailed."
    }

    return [
        {
            step: 1,
            title: "Preparation",
            tech: "Data is split (70% Train, 15% Val, 15% Test). Features are scaled using StandardScaler (z-score normalization).",
            kitchen: "Mise en place: We separate the ingredients. We chop everything to the same size so it cooks evenly."
        },
        {
            step: 2,
            title: isTreeEnsemble ? "Ensemble Growth" : isNeuralNet ? "Training Epochs" : "Learning Curve",
            tech: step2Tech,
            kitchen: step2Kitchen
        },
        {
            step: 3,
            title: "Live Validation",
            tech: "At every step/epoch, we evaluate the current model on the Validation Set (15%) to monitor for overfitting.",
            kitchen: "Tasting: The head chef tastes the dish every time a new step completes. If it starts tasting 'burnt' (Overfitting), we stop immediately."
        },
        {
            step: 4,
            title: "Final Exam",
            tech: "Once fully trained, we run inference on the held-out Test Set (15%) for the final generalization score.",
            kitchen: "Service: The dish is finished. We serve it to a real customer (who we haven't met before) for the final verdict."
        }
    ]
}

const MODEL_EXPLANATIONS: Record<string, { tech: string, kitchen: string }> = {
    "LogisticRegression": {
        tech: "A linear model that estimates the probability of a binary outcome using a sigmoid function. It finds the optimal decision boundary by minimizing log-loss, making it efficient for linearly separable data.",
        kitchen: "Like a simple Taste Test: You separate the salty dishes from the sweet ones by drawing a straight line on the table. It's fast, simple, and works great if your food types are clearly distinct!"
    },
    "RandomForest": {
        tech: "An ensemble learning method that constructs multiple decision trees during training. It outputs the class that is the mode of the classes (voting) of the individual trees, reducing overfitting.",
        kitchen: "A Council of Chefs: Instead of trusting one chef (who might have weird tastes), you ask 100 chefs to vote. If 90 say 'it's salty', you trust the group. It's much more reliable!"
    },
    "MLPClassifier": {
        tech: "A Multi-Layer Perceptron (Neural Network) that learns non-linear function approximations. It uses backpropagation to adjust weights across hidden layers, capturing complex feature interactions.",
        kitchen: "The Master Chef Brain: A complex network of sous-chefs passing messages. One tastes sugar, one tastes acid, one tastes texture... they communicate in layers to decide if the dish is 'Perfect'. extremely powerful but takes time to train."
    },
    "SVM": {
        tech: "Support Vector Machine finds the hyperplane that maximizes the margin (distance) between classes. It uses kernels to project data into higher dimensions for non-linear separation.",
        kitchen: "The Strict Food Critic: They don't just want the foods separated; they want a 'Safety Margin' between them. They look for the widest gap possible on the table so not a single crumb is mislabeled."
    },
    "GradientBoosting": {
        tech: "An ensemble technique that builds trees sequentially, where each new tree corrects the errors of the previous ones. It optimizes a loss function using gradient descent.",
        kitchen: "The Perfectionist Line Cook: The first cook makes a dish. The second cook tastes it, finds the mistakes, and fixes them. The third cook fixes the second cook's mistakes. By the end, the dish is perfect."
    },
    "DecisionTree": {
        tech: "A non-parametric model that splits data into subsets based on the most significant attribute at each node. It creates a tree-like structure of decisions.",
        kitchen: "The Recipe Card: A simple flowchart. 'Is it red?' -> Yes. 'Is it round?' -> Yes. 'Then it's an Apple.' It follows a clear path of simple Yes/No questions to reach a conclusion."
    },
    "KNN": {
        tech: "K-Nearest Neighbors classifies a data point based on the majority class of its 'k' nearest neighbors in the feature space. It is a lazy learning algorithm.",
        kitchen: "The Copycat: If you don't know what a dish is, you look at the 5 dishes sitting closest to it on the buffet. If 4 are salads, this one is probably a salad too!"
    },
    "NaiveBayes": {
        tech: "A probabilistic classifier based on Bayes' Theorem with an assumption of independence between features. It is particularly effective for high-dimensional data like text.",
        kitchen: "The Stereotyper: It glances at ingredients and guesses instantly. 'Has garlic? Probably Italian.' 'Has soy sauce? Probably Asian.' It ignores how ingredients mix but is shockingly fast and often right."
    },
    "AdaBoost": {
        tech: "Adaptive Boosting focuses on training new weak learners on the data points that were misclassified by previous learners, increasing their weights.",
        kitchen: "The Specialist Team: The first chef fails at cooking steak. So the next chef is hired ONLY to focus on steak. The third chef focuses on whatever they both missed. Together, they cover every weakness."
    },
    "default": {
        tech: "Select a model to see its technical explanation.",
        kitchen: "Select a model to see its kitchen analogy."
    }
}

const API = "http://localhost:8000"

export default function NewExperimentPage() {
    const router = useRouter()
    const [datasets, setDatasets] = useState<string[]>([])
    const [selectedDataset, setSelectedDataset] = useState<string | null>(null)

    const [selectedModel, setSelectedModel] = useState<string>("RandomForest")
    const [params, setParams] = useState<any>({})

    const [isUploading, setIsUploading] = useState(false)
    const [isStarting, setIsStarting] = useState(false)

    // Fetch Datasets on Mount
    useEffect(() => {
        refreshDatasets()
    }, [])

    const refreshDatasets = async () => {
        try {
            const res = await axios.get(`${API}/datasets/`)
            const list = res.data.datasets || []
            setDatasets(list)

            // Auto-select first if none selected
            if (!selectedDataset && list.length > 0) {
                setSelectedDataset(list[0])
            }
        } catch (e) { console.error(e) }
    }

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setIsUploading(true)
        const formData = new FormData()
        formData.append("file", file)

        const input = e.target // Capture for reset

        try {
            await axios.post(`${API}/upload/`, formData, {
                headers: { "Content-Type": "multipart/form-data" },
                timeout: 30000 // 30s timeout
            })
            // Immediately select and add the file we just uploaded for better UX
            setDatasets(prev => {
                if (prev.includes(file.name)) return prev
                return [...prev, file.name]
            })
            setSelectedDataset(file.name)

            // Then refresh the full list from server to ensure sync
            await refreshDatasets()
        } catch (e) {
            console.error("Upload error:", e)
            alert("Upload failed. Check console/backend.")
        } finally {
            setIsUploading(false)
            input.value = "" // Reset input
        }
    }

    const startTraining = async () => {
        if (!selectedDataset) return alert("Please select a dataset")
        setIsStarting(true)

        try {
            // Create Experiment Bucket (if not exists)
            try { await axios.post(`${API}/experiments/`, { name: "Web Experiment" }) } catch { }

            // Start Job
            const res = await axios.post(`${API}/jobs/start`, {
                experiment_id: 1, // hardcoded for MVP
                dataset_filename: selectedDataset,
                model: selectedModel,
                params: params
            })

            // Redirect to the new run
            router.push(`/runs/${res.data.id}`)

        } catch (e) {
            alert("Failed to start job")
            console.error(e)
            setIsStarting(false)
        }
    }

    return (
        <div className="min-h-screen bg-background p-8 dark:text-white">
            <div className="max-w-4xl mx-auto space-y-6">
                <Link href="/" className="flex items-center text-muted-foreground hover:text-white transition">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Cancel & Back
                </Link>

                <h1 className="text-3xl font-bold bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
                    Create New Experiment
                </h1>

                {/* STEP 1: DATASET */}
                <Card className="bg-card/50">
                    <CardHeader>
                        <CardTitle className="flex items-center"><Server className="mr-2 h-5 w-5 text-blue-500" /> Select Dataset</CardTitle>
                        <CardDescription>Choose a CSV file to train on</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {datasets.map(ds => (
                                <div
                                    key={ds}
                                    onClick={() => setSelectedDataset(ds)}
                                    className={cn(
                                        "p-4 rounded-lg border cursor-pointer transition-all flex items-center justify-between",
                                        selectedDataset === ds
                                            ? "border-blue-500 bg-blue-500/10 text-white shadow-[0_0_15px_rgba(59,130,246,0.5)]"
                                            : "border-border hover:bg-muted/50"
                                    )}
                                >
                                    <span className="truncate font-mono text-sm">{ds}</span>
                                    {selectedDataset === ds && <div className="h-2 w-2 rounded-full bg-blue-500" />}
                                </div>
                            ))}

                            {/* Upload Button */}
                            <label className="p-4 rounded-lg border border-dashed border-muted-foreground/40 hover:border-white/50 hover:bg-muted/30 cursor-pointer flex flex-col items-center justify-center transition-all text-muted-foreground hover:text-white">
                                {isUploading ? (
                                    <span className="animate-pulse">Uploading...</span>
                                ) : (
                                    <>
                                        <Upload className="h-6 w-6 mb-2" />
                                        <span className="text-sm">Upload CSV</span>
                                    </>
                                )}
                                <input type="file" accept=".csv" className="hidden" onChange={handleUpload} disabled={isUploading} />
                            </label>
                        </div>
                    </CardContent>
                </Card>

                {/* STEP 2: MODEL */}
                <Card className="bg-card/50">
                    <CardHeader>
                        <CardTitle className="flex items-center"><Server className="mr-2 h-5 w-5 text-purple-500" /> Model Configuration</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Model Architecture</label>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                {MODELS.map(m => (
                                    <button
                                        key={m}
                                        onClick={() => setSelectedModel(m)}
                                        className={cn(
                                            "px-3 py-2 rounded-md text-sm transition-all",
                                            selectedModel === m
                                                ? "bg-purple-600 text-white shadow-lg shadow-purple-500/30"
                                                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                                        )}
                                    >
                                        {m}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Dynamic Params (Simple version) */}
                        {selectedModel === "MLPClassifier" && (
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs uppercase text-muted-foreground">Learning Rate</label>
                                    <input
                                        type="number" step="0.0001" defaultValue="0.001"
                                        onChange={(e) => setParams({ ...params, learning_rate_init: parseFloat(e.target.value) })}
                                        className="w-full bg-background border border-border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs uppercase text-muted-foreground">Epochs</label>
                                    <input
                                        type="number" defaultValue="50"
                                        onChange={(e) => setParams({ ...params, max_iter: parseInt(e.target.value) })}
                                        className="w-full bg-background border border-border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs uppercase text-muted-foreground">Batch Size</label>
                                    <input
                                        type="number" defaultValue="32"
                                        onChange={(e) => setParams({ ...params, batch_size: parseInt(e.target.value) })}
                                        className="w-full bg-background border border-border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                                    />
                                </div>
                            </div>
                        )}
                        {(selectedModel === "RandomForest" || selectedModel === "GradientBoosting" || selectedModel === "AdaBoost") && (
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs uppercase text-muted-foreground">Trees (Estimators)</label>
                                    <input
                                        type="number" defaultValue={selectedModel === "AdaBoost" ? "50" : "100"}
                                        onChange={(e) => setParams({ ...params, n_estimators: parseInt(e.target.value) })}
                                        className="w-full bg-background border border-border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                                    />
                                </div>
                                {(selectedModel !== "AdaBoost") && (
                                    <div className="space-y-2">
                                        <label className="text-xs uppercase text-muted-foreground">Max Depth</label>
                                        <input
                                            type="number" defaultValue="10"
                                            onChange={(e) => setParams({ ...params, max_depth: parseInt(e.target.value) })}
                                            className="w-full bg-background border border-border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                                        />
                                    </div>
                                )}
                            </div>
                        )}
                        {selectedModel === "KNN" && (
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs uppercase text-muted-foreground">Neighbors (K)</label>
                                    <input
                                        type="number" defaultValue="5"
                                        onChange={(e) => setParams({ ...params, n_neighbors: parseInt(e.target.value) })}
                                        className="w-full bg-background border border-border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Model Explainer */}
                        {selectedModel && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                <div className="bg-blue-950/30 p-4 rounded-lg border border-blue-500/20">
                                    <h4 className="flex items-center text-blue-400 font-bold mb-2">
                                        <div className="w-2 h-2 bg-blue-500 rounded-full mr-2" />
                                        Technical Context (ML Engineer)
                                    </h4>
                                    <p className="text-sm text-blue-100/80 leading-relaxed">
                                        {MODEL_EXPLANATIONS[selectedModel]?.tech || MODEL_EXPLANATIONS["default"].tech}
                                    </p>
                                </div>
                                <div className="bg-orange-950/30 p-4 rounded-lg border border-orange-500/20">
                                    <h4 className="flex items-center text-orange-400 font-bold mb-2">
                                        <div className="w-2 h-2 bg-orange-500 rounded-full mr-2" />
                                        Kitchen Context ( The Chef)
                                    </h4>
                                    <p className="text-sm text-orange-100/80 leading-relaxed">
                                        {MODEL_EXPLANATIONS[selectedModel]?.kitchen || MODEL_EXPLANATIONS["default"].kitchen}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Process Flowchart - Only show if model selected */}
                        {selectedModel && (
                            <div className="mb-8">
                                <h3 className="text-lg font-bold mb-4 flex items-center">
                                    <span className="bg-purple-500/20 text-purple-300 px-2 py-1 rounded text-sm mr-2">Workflow</span>
                                    How it Works: {selectedModel}
                                </h3>

                                <div className="space-y-4 relative">
                                    {/* Connecting Line */}
                                    <div className="absolute left-6 top-4 bottom-4 w-0.5 bg-gradient-to-b from-blue-500/50 to-orange-500/50 hidden md:block" />

                                    {getProcessFlow(selectedModel).map((step, idx) => (
                                        <div key={idx} className="relative z-10 grid grid-cols-1 md:grid-cols-[50px_1fr_1fr] gap-4 items-center">
                                            {/* Number Bubble */}
                                            <div className="hidden md:flex items-center justify-center w-12 h-12 rounded-full bg-background border-2 border-purple-500/50 font-bold text-lg shadow-lg shadow-purple-900/50">
                                                {step.step}
                                            </div>

                                            {/* Tech Card */}
                                            <div className="bg-blue-950/20 border border-blue-500/10 p-4 rounded-lg hover:bg-blue-900/20 transition-colors">
                                                <h5 className="text-blue-400 text-xs font-bold uppercase mb-1">Technical Step</h5>
                                                <p className="text-blue-100/90 text-sm">{step.tech}</p>
                                            </div>

                                            {/* Kitchen Card */}
                                            <div className="bg-orange-950/20 border border-orange-500/10 p-4 rounded-lg hover:bg-orange-900/20 transition-colors">
                                                <h5 className="text-orange-400 text-xs font-bold uppercase mb-1">Kitchen Analogy</h5>
                                                <p className="text-orange-100/90 text-sm">{step.kitchen}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <div className="flex justify-end pt-4" onClick={startTraining}>
                    <button
                        disabled={!selectedDataset || isStarting}
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white px-8 py-3 rounded-full font-bold shadow-lg shadow-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center transition-all transform hover:scale-105"
                    >
                        {isStarting ? (
                            "Starting Engine..."
                        ) : !selectedDataset ? (
                            "Select a Dataset First"
                        ) : (
                            <>
                                <Play className="mr-2 h-5 w-5 fill-current" /> Start Training
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    )
}
