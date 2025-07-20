import { useState, useEffect } from "react"
import { Layout } from "@/components/Layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Upload, FileText, Settings, ChevronDown, ChevronRight, Sparkles, RotateCcw, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Question {
  question: string
  type: string
  complexity: string
  expectedAnswer: string
  skills: string[]
}

interface APIQuestion {
  question: string
  type: string
  complexity: string
  expectedAnswer: string
  skills: string[]
}

interface APIResponse {
  success: boolean
  data: {
    role: string
    requestedSkills: string[]
    questionComplexity: number
    numberOfQuestions: number
    questions: APIQuestion[]
  }
  timestamp: string
}

interface Role {
  _id: string
  role: string
  skills: string[]
}

export default function Interview() {
  const { toast } = useToast()
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [selectedRole, setSelectedRole] = useState("")
  const [selectedSkills, setSelectedSkills] = useState<string[]>([])
  const [complexity, setComplexity] = useState(50)
  const [questionCount, setQuestionCount] = useState(10)
  const [generatedQuestions, setGeneratedQuestions] = useState<Question[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [expandedQuestions, setExpandedQuestions] = useState<Set<number>>(new Set())

  // API data states
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch roles on component mount
  useEffect(() => {
    fetchRoles()
  }, [])

  const fetchRoles = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch('http://localhost:3000/api/candidate-role-skills')
      if (!response.ok) {
        throw new Error(`Failed to fetch roles: ${response.status}`)
      }
      const result = await response.json()
      const data = result.data || result
      const rolesArray = Array.isArray(data) ? data : []
      setRoles(rolesArray)
    } catch (error) {
      console.error('Error fetching roles:', error)
      setError('Failed to fetch roles. Please check if the API server is running.')
      toast({
        title: "Error",
        description: "Failed to fetch roles. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // Get available skills for selected role
  const availableSkills = roles.find(role => role._id === selectedRole)?.skills || []

  const getComplexityLabel = (value: number): string => {
    if (value <= 25) return "Easy"
    if (value <= 50) return "Medium-Low"
    if (value <= 75) return "Medium-High"
    return "Hard"
  }

  const getComplexityDescription = (value: number): string => {
    if (value <= 25) return "Basic concepts and straightforward implementations"
    if (value <= 50) return "Intermediate concepts with some complexity"
    if (value <= 75) return "Advanced concepts requiring deeper understanding"
    return "Expert-level with edge cases and complex scenarios"
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setUploadedFile(file)
      toast({
        title: "Resume uploaded",
        description: `${file.name} has been uploaded successfully.`
      })
    }
  }

  const toggleSkill = (skill: string) => {
    setSelectedSkills(prev =>
      prev.includes(skill)
        ? prev.filter(s => s !== skill)
        : [...prev, skill]
    )
  }

  const generateQuestions = async () => {
    if (!selectedRole || selectedSkills.length === 0) {
      toast({
        title: "Missing requirements",
        description: "Please select a role and at least one skill.",
        variant: "destructive"
      })
      return
    }

    setIsGenerating(true)
    setGeneratedQuestions([])

    try {
      // Create FormData for the API request
      const formData = new FormData()
      formData.append('role', roles.find(r => r._id === selectedRole)?.role || '')
      formData.append('skills', JSON.stringify(selectedSkills))
      formData.append('questionComplexity', complexity.toString())
      formData.append('numberOfQuestions', questionCount.toString())
      
      // Add the uploaded file if it exists
      if (uploadedFile) {
        formData.append('pdf', uploadedFile)
      }

      const response = await fetch('http://localhost:3000/api/interview-questions/generate', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error(`Failed to generate questions: ${response.status}`)
      }

      const result: APIResponse = await response.json()
      const questions = result.data?.questions || []
      
      // Transform the API response to match our Question interface
      const transformedQuestions: Question[] = questions.map((q: APIQuestion, index: number) => ({
        question: q.question,
        type: q.type,
        complexity: q.complexity,
        expectedAnswer: q.expectedAnswer,
        skills: q.skills
      }))

      setGeneratedQuestions(transformedQuestions)
      toast({
        title: "Questions generated",
        description: `${transformedQuestions.length} questions have been generated based on your selections.`
      })
    } catch (error) {
      console.error('Error generating questions:', error)
    toast({
        title: "Error",
        description: "Failed to generate questions. Please try again.",
        variant: "destructive"
    })
    } finally {
      setIsGenerating(false)
    }
  }

  const toggleQuestion = (questionIndex: number) => {
    setExpandedQuestions(prev => {
      const newSet = new Set(prev)
      if (newSet.has(questionIndex)) {
        newSet.delete(questionIndex)
      } else {
        newSet.add(questionIndex)
      }
      return newSet
    })
  }

  const resetForm = () => {
    setUploadedFile(null)
    setSelectedRole("")
    setSelectedSkills([])
    setComplexity(50)
    setQuestionCount(10)
    setGeneratedQuestions([])
    setExpandedQuestions(new Set())
    
    // Clear file input
    const fileInput = document.getElementById('resume-upload') as HTMLInputElement
    if (fileInput) fileInput.value = ''
  }

  if (loading) {
    return (
      <Layout 
        title="Interview Generator"
        action={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={resetForm}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
          </div>
        }
      >
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading roles and skills...</p>
            </div>
          </div>
        </div>
      </Layout>
    )
  }

  if (error) {
    return (
      <Layout 
        title="Interview Generator"
        action={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={resetForm}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
          </div>
        }
      >
        <div className="max-w-4xl mx-auto space-y-6">
          <Card className="interview-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Connection Error</h3>
                  <p className="text-muted-foreground mb-4">{error}</p>
                  <Button onClick={fetchRoles} className="interview-button-primary">
                    Try Again
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </Layout>
    )
  }

  return (
    <Layout 
      title="Interview Generator"
      action={
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={resetForm}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
        </div>
      }
    >
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Configuration Panel */}
          <div className="space-y-6">
            {/* Resume Upload */}
            <Card className="interview-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Resume Upload
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
                    <input
                      id="resume-upload"
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <label htmlFor="resume-upload" className="cursor-pointer">
                      <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-sm font-medium mb-2">
                        {uploadedFile ? uploadedFile.name : "Click to upload resume"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        PDF, DOC, or DOCX files accepted
                      </p>
                    </label>
                  </div>
                  {uploadedFile && (
                    <div className="flex items-center gap-2 text-sm text-success">
                      <FileText className="h-4 w-4" />
                      Resume uploaded successfully
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Role & Skills Selection */}
            <Card className="interview-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Role & Skills
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Role Selection */}
                <div>
                  <Label className="text-sm font-medium">Select Role</Label>
                  <Select value={selectedRole} onValueChange={setSelectedRole}>
                    <SelectTrigger className="w-full mt-2">
                      <SelectValue placeholder="Choose a role" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map(role => (
                        <SelectItem key={role._id} value={role._id}>
                          {role.role}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Skills Selection */}
                {selectedRole && (
                  <div>
                    <Label className="text-sm font-medium">
                      Select Skills ({selectedSkills.length} selected)
                    </Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {availableSkills.map(skill => (
                        <Badge
                          key={skill}
                          variant={selectedSkills.includes(skill) ? "default" : "outline"}
                          className="cursor-pointer hover:bg-primary/80"
                          onClick={() => toggleSkill(skill)}
                        >
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Interview Settings */}
            <Card className="interview-card">
              <CardHeader>
                <CardTitle>Interview Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Question Complexity Slider */}
                <div>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div>
                          <Label className="text-sm font-medium flex items-center gap-2 mb-3">
                            Question Complexity
                            <span className="text-xs text-muted-foreground">({complexity}/100)</span>
                          </Label>
                          <div className="space-y-4">
                            <Slider
                              value={[complexity]}
                              onValueChange={(value) => setComplexity(value[0])}
                              max={100}
                              min={0}
                              step={1}
                              className="w-full"
                            />
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>Very Easy</span>
                              <span>Medium</span>
                              <span>Very Hard</span>
                            </div>
                          </div>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Drag toward 'Hard' for more in-depth/edge-case questions.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <div className="mt-3 p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{getComplexityLabel(complexity)}</span>
                      <Badge variant="outline" className="text-xs">
                        {complexity <= 25 ? '🟢' : complexity <= 50 ? '🟡' : complexity <= 75 ? '🟠' : '🔴'} Level {Math.ceil(complexity / 25)}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {getComplexityDescription(complexity)}
                    </p>
                  </div>
                </div>

                {/* Dynamic Number of Questions */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <Label className="text-sm font-medium">Number of Questions</Label>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setQuestionCount(Math.max(1, questionCount - 1))}
                        disabled={questionCount <= 1}
                        className="h-8 w-8 p-0"
                      >
                        -
                      </Button>
                      <span className="min-w-[3rem] text-center font-semibold text-lg">
                        {questionCount}
                      </span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setQuestionCount(Math.min(20, questionCount + 1))}
                        disabled={questionCount >= 20}
                        className="h-8 w-8 p-0"
                      >
                        +
                      </Button>
                    </div>
                  </div>
                  <Input
                    type="range"
                    min="1"
                    max="20"
                    step="1"
                    value={questionCount}
                    onChange={(e) => setQuestionCount(Number(e.target.value))}
                    className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer slider"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-2">
                    <span>1 question</span>
                    <span>10 questions</span>
                    <span>20 questions</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {questionCount <= 5 ? 'Quick interview' :
                     questionCount <= 10 ? 'Standard interview' :
                     questionCount <= 15 ? 'Comprehensive interview' : 'Extended assessment'}
                  </p>
                </div>

                {/* Generate Button */}
                <Button
                  onClick={generateQuestions}
                  disabled={!selectedRole || selectedSkills.length === 0 || isGenerating}
                  className="w-full interview-button-primary"
                >
                  {isGenerating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Generating Questions...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Generate Interview
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Results Panel */}
          <div className="space-y-6">
            {generatedQuestions.length > 0 ? (
              <Card className="interview-card">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Interview Questions</span>
                    <Badge variant="secondary">
                      {generatedQuestions.length} questions
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {generatedQuestions.map((question, index) => (
                      <Collapsible 
                        key={`${question.question}-${index}`}
                        open={expandedQuestions.has(index)}
                        onOpenChange={() => toggleQuestion(index)}
                      >
                        <CollapsibleTrigger className="w-full">
                          <div className="flex items-start gap-3 p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors text-left">
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-semibold flex-shrink-0">
                              {index + 1}
                            </span>
                            <div className="flex-1">
                              <p className="font-medium text-sm">{question.question}</p>
                              <div className="flex items-center gap-2 mt-2">
                                <Badge variant="outline" className="text-xs">
                                  {question.complexity}
                                </Badge>
                                {expandedQuestions.has(index) ? (
                                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                ) : (
                                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                )}
                              </div>
                            </div>
                          </div>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <div className="mt-2 p-4 bg-muted/30 rounded-lg border-l-2 border-primary/20">
                            <h4 className="font-medium text-sm mb-2">Sample Answer:</h4>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                              {question.expectedAnswer}
                            </p>
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="interview-card text-center py-12">
                <CardContent>
                  <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Ready to Generate</h3>
                  <p className="text-muted-foreground">
                    Configure your settings and click "Generate Interview" to create customized questions.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}