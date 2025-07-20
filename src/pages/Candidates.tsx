import { useState } from "react"
import { Layout } from "@/components/Layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Search, Eye, Upload, User, Mail, Phone, Calendar, Briefcase, GraduationCap } from "lucide-react"

interface Candidate {
  id: string
  name: string
  email: string
  phone: string
  roleApplied?: string
  skills: string[]
  uploadDate: string
  resumeData: {
    education: Array<{
      degree: string
      institution: string
      year: string
    }>
    experience: Array<{
      position: string
      company: string
      duration: string
      description: string
    }>
    summary: string
  }
}

export default function Candidates() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null)
  
  const [candidates] = useState<Candidate[]>([
    {
      id: "1",
      name: "Sarah Johnson",
      email: "sarah.johnson@email.com",
      phone: "+1 (555) 123-4567",
      roleApplied: "Frontend Developer",
      skills: ["React", "TypeScript", "CSS", "JavaScript", "HTML"],
      uploadDate: "2024-01-15",
      resumeData: {
        education: [
          { degree: "Bachelor of Computer Science", institution: "MIT", year: "2020" }
        ],
        experience: [
          {
            position: "Frontend Developer",
            company: "Tech Corp",
            duration: "2020-2024",
            description: "Developed responsive web applications using React and TypeScript. Led UI/UX initiatives and improved application performance by 40%."
          }
        ],
        summary: "Experienced frontend developer with 4+ years building modern web applications. Passionate about user experience and clean, maintainable code."
      }
    },
    {
      id: "2",
      name: "Michael Chen",
      email: "michael.chen@email.com",
      phone: "+1 (555) 987-6543",
      roleApplied: "Backend Developer",
      skills: ["Node.js", "Python", "SQL", "MongoDB", "Express"],
      uploadDate: "2024-01-12",
      resumeData: {
        education: [
          { degree: "Master of Software Engineering", institution: "Stanford", year: "2019" }
        ],
        experience: [
          {
            position: "Senior Backend Developer",
            company: "Data Systems Inc",
            duration: "2019-2024",
            description: "Architected scalable backend systems handling 1M+ requests daily. Implemented microservices architecture and improved system reliability."
          }
        ],
        summary: "Senior backend developer specializing in scalable system architecture and database optimization. Strong background in cloud technologies."
      }
    },
    {
      id: "3",
      name: "Emily Rodriguez",
      email: "emily.rodriguez@email.com",
      phone: "+1 (555) 456-7890",
      skills: ["React", "Node.js", "Python", "SQL"],
      uploadDate: "2024-01-10",
      resumeData: {
        education: [
          { degree: "Bachelor of Information Technology", institution: "UC Berkeley", year: "2021" }
        ],
        experience: [
          {
            position: "Full Stack Developer",
            company: "StartupXYZ",
            duration: "2021-2024",
            description: "Built full-stack web applications from concept to deployment. Worked across the entire technology stack."
          }
        ],
        summary: "Full-stack developer with experience in both frontend and backend technologies. Quick learner with startup experience."
      }
    }
  ])

  const filteredCandidates = candidates.filter(candidate =>
    candidate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    candidate.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    candidate.skills.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (candidate.roleApplied && candidate.roleApplied.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  return (
    <Layout 
      title="Candidates Management"
      action={
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">
            {filteredCandidates.length} of {candidates.length} candidate{candidates.length !== 1 ? 's' : ''}
          </span>
          <Button className="interview-button-primary">
            <Upload className="h-4 w-4 mr-2" />
            Upload Resume
          </Button>
        </div>
      }
    >
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Search Bar */}
        <Card>
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, skill, or role..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Candidates Table */}
        <Card className="interview-card">
          <CardHeader>
            <CardTitle>Candidate Database</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredCandidates.map((candidate) => (
                <div 
                  key={candidate.id}
                  className="p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 space-y-2">
                      {/* Candidate Info */}
                      <div className="flex items-center gap-4 flex-wrap">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="font-semibold">{candidate.name}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Mail className="h-4 w-4" />
                          {candidate.email}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Phone className="h-4 w-4" />
                          {candidate.phone}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          {new Date(candidate.uploadDate).toLocaleDateString()}
                        </div>
                      </div>

                      {/* Role Applied */}
                      {candidate.roleApplied && (
                        <div className="flex items-center gap-2">
                          <Briefcase className="h-4 w-4 text-muted-foreground" />
                          <Badge variant="outline">{candidate.roleApplied}</Badge>
                        </div>
                      )}

                      {/* Skills */}
                      <div className="flex flex-wrap gap-1">
                        {candidate.skills.slice(0, 5).map((skill, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                        {candidate.skills.length > 5 && (
                          <Badge variant="secondary" className="text-xs">
                            +{candidate.skills.length - 5} more
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedCandidate(candidate)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2">
                            <User className="h-5 w-5" />
                            {candidate.name} - Resume Details
                          </DialogTitle>
                        </DialogHeader>
                        
                        <div className="space-y-6 py-4">
                          {/* Contact Info */}
                          <div>
                            <h3 className="font-semibold mb-3 flex items-center gap-2">
                              <Mail className="h-4 w-4" />
                              Contact Information
                            </h3>
                            <div className="space-y-2 text-sm">
                              <p><strong>Email:</strong> {candidate.email}</p>
                              <p><strong>Phone:</strong> {candidate.phone}</p>
                              {candidate.roleApplied && (
                                <p><strong>Role Applied:</strong> {candidate.roleApplied}</p>
                              )}
                            </div>
                          </div>

                          {/* Summary */}
                          <div>
                            <h3 className="font-semibold mb-3">Professional Summary</h3>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                              {candidate.resumeData.summary}
                            </p>
                          </div>

                          {/* Skills */}
                          <div>
                            <h3 className="font-semibold mb-3">Technical Skills</h3>
                            <div className="flex flex-wrap gap-2">
                              {candidate.skills.map((skill, index) => (
                                <Badge key={index} variant="secondary">
                                  {skill}
                                </Badge>
                              ))}
                            </div>
                          </div>

                          {/* Experience */}
                          <div>
                            <h3 className="font-semibold mb-3 flex items-center gap-2">
                              <Briefcase className="h-4 w-4" />
                              Work Experience
                            </h3>
                            <div className="space-y-4">
                              {candidate.resumeData.experience.map((exp, index) => (
                                <div key={index} className="border-l-2 border-primary/20 pl-4">
                                  <h4 className="font-medium">{exp.position}</h4>
                                  <p className="text-sm text-muted-foreground">{exp.company} • {exp.duration}</p>
                                  <p className="text-sm mt-2 leading-relaxed">{exp.description}</p>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Education */}
                          <div>
                            <h3 className="font-semibold mb-3 flex items-center gap-2">
                              <GraduationCap className="h-4 w-4" />
                              Education
                            </h3>
                            <div className="space-y-2">
                              {candidate.resumeData.education.map((edu, index) => (
                                <div key={index}>
                                  <h4 className="font-medium">{edu.degree}</h4>
                                  <p className="text-sm text-muted-foreground">{edu.institution} • {edu.year}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              ))}
            </div>

            {filteredCandidates.length === 0 && (
              <div className="text-center py-12">
                <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  {searchTerm ? "No candidates found" : "No candidates uploaded yet"}
                </h3>
                <p className="text-muted-foreground">
                  {searchTerm 
                    ? "Try adjusting your search terms or clear the search to see all candidates."
                    : "Upload candidate resumes to start building your database."
                  }
                </p>
                {searchTerm && (
                  <Button 
                    variant="outline" 
                    onClick={() => setSearchTerm("")}
                    className="mt-4"
                  >
                    Clear Search
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}