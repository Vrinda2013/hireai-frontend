import { useState } from "react"
import { Layout } from "@/components/Layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Search, Eye, Upload, User, Mail, Phone, Calendar, Briefcase, GraduationCap } from "lucide-react"
import { useEffect, useRef } from "react"

// --- Types matching the API ---
interface CandidateAPI {
  _id: string
  personalInfo: {
    fullName: string
  email: string
  phone: string
    location?: string
    linkedin?: string | null
  }
  professionalInfo: {
    currentTitle?: string
    yearsOfExperience?: string
    education?: string
    certifications?: string[]
  }
  roleApplied?: {
    role?: string
    requestedSkills?: string[]
  }
  professionalSummary?: string
  workExperience?: Array<{
    title?: string
    company?: string
    years?: string | null
    description?: string
    }>
  technicalSkills?: string[]
  softSkills?: string[]
  createdAt?: string
}

export default function Candidates() {
  const [searchTerm, setSearchTerm] = useState("")
  const [searchMode, setSearchMode] = useState(false)
  const [searchLoading, setSearchLoading] = useState(false)
  const [candidates, setCandidates] = useState<CandidateAPI[]>([])
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateAPI | null>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const observer = useRef<HTMLDivElement | null>(null)

  // Fetch candidates for a page
  const fetchCandidates = (pageNum: number) => {
    setLoading(true)
    fetch(`http://localhost:3000/api/candidate-resumes?page=${pageNum}&limit=5`)
      .then(res => res.json())
      .then(data => {
        setCandidates(data.data || [])
        setTotalPages(data.pagination?.pages || 1)
        setPage(data.pagination?.page || 1)
        setHasMore(data.pagination?.page < data.pagination?.pages)
        setError(null)
      })
      .catch(() => setError("Failed to fetch candidates."))
      .finally(() => setLoading(false))
  }

  // Search by email
  const handleSearch = () => {
    const email = searchTerm.trim()
    if (!email) {
      setSearchMode(false)
      fetchCandidates(1)
      return
    }
    setSearchLoading(true)
    setSearchMode(true)
    fetch('http://localhost:3000/api/candidate-resumes/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    })
      .then(res => res.json())
      .then(data => {
        setCandidates(data.data || [])
        setTotalPages(1)
        setPage(1)
        setError(null)
      })
      .catch(() => setError("Failed to search candidates."))
      .finally(() => setSearchLoading(false))
  }

  // Initial fetch
  useEffect(() => {
    fetchCandidates(1)
    // eslint-disable-next-line
  }, [])

  // Pagination controls
  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages || newPage === page) return
    fetchCandidates(newPage)
  }

  // Only filter client-side if not in search mode
  const filteredCandidates = searchMode ? candidates : candidates.filter(candidate => {
    const { personalInfo, professionalInfo, roleApplied, technicalSkills, softSkills } = candidate
    const search = searchTerm.toLowerCase()
    return (
      personalInfo.fullName.toLowerCase().includes(search) ||
      personalInfo.email.toLowerCase().includes(search) ||
      (personalInfo.phone && personalInfo.phone.toLowerCase().includes(search)) ||
      (personalInfo.location && personalInfo.location.toLowerCase().includes(search)) ||
      (professionalInfo.currentTitle && professionalInfo.currentTitle.toLowerCase().includes(search)) ||
      (roleApplied?.role && roleApplied.role.toLowerCase().includes(search)) ||
      (technicalSkills && technicalSkills.some(skill => skill.toLowerCase().includes(search))) ||
      (softSkills && softSkills.some(skill => skill.toLowerCase().includes(search)))
  )
  })

  return (
    <Layout 
      title="Candidates Management"
      action={
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">
            {filteredCandidates.length} of {candidates.length} candidate{candidates.length !== 1 ? 's' : ''}
          </span>
        </div>
      }
    >
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Search Bar */}
        <Card>
          <CardContent className="pt-6">
            <div className="relative flex items-center gap-2">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by candidate email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleSearch() }}
                className="pl-10"
                disabled={searchLoading || loading}
                type="email"
                autoComplete="off"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleSearch}
                disabled={searchLoading || loading || !searchTerm.trim()}
              >
                {searchLoading ? 'Searching...' : 'Search'}
              </Button>
              {searchMode && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { setSearchTerm(""); setSearchMode(false); fetchCandidates(1); }}
                  disabled={loading}
                >
                  Clear
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Candidates Table */}
        <Card className="interview-card">
          <CardHeader>
            <CardTitle>Candidate Database</CardTitle>
          </CardHeader>
          <CardContent>
            {loading && (
              <div className="text-center py-12 text-muted-foreground">Loading candidates...</div>
            )}
            {error && (
              <div className="text-center py-12 text-destructive">{error}</div>
            )}
            <div className="space-y-4">
              {filteredCandidates.map((candidate) => (
                <div 
                  key={candidate._id}
                  className="p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 space-y-2">
                      {/* Candidate Info */}
                      <div className="flex items-center gap-4 flex-wrap">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="font-semibold">{candidate.personalInfo.fullName}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Mail className="h-4 w-4" />
                          {candidate.personalInfo.email}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Phone className="h-4 w-4" />
                          {candidate.personalInfo.phone}
                        </div>
                        {candidate.personalInfo.location && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Briefcase className="h-4 w-4" />
                            {candidate.personalInfo.location}
                          </div>
                        )}
                        {candidate.professionalInfo.currentTitle && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <GraduationCap className="h-4 w-4" />
                            {candidate.professionalInfo.currentTitle}
                        </div>
                        )}
                      </div>

                      {/* Role Applied */}
                      {candidate.roleApplied?.role && (
                        <div className="flex items-center gap-2">
                          <Briefcase className="h-4 w-4 text-muted-foreground" />
                          <Badge variant="outline">{candidate.roleApplied.role}</Badge>
                        </div>
                      )}

                      {/* Skills */}
                      <div className="flex flex-wrap gap-1">
                        {(candidate.technicalSkills || []).slice(0, 5).map((skill, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                        {(candidate.softSkills || []).slice(0, 2).map((skill, index) => (
                          <Badge key={"soft-"+index} variant="outline" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                        {((candidate.technicalSkills?.length || 0) > 5 || (candidate.softSkills?.length || 0) > 2) && (
                          <Badge variant="secondary" className="text-xs">
                            +more
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
                            {candidate.personalInfo.fullName} - Resume Details
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
                              <p><strong>Email:</strong> {candidate.personalInfo.email}</p>
                              <p><strong>Phone:</strong> {candidate.personalInfo.phone}</p>
                              {candidate.personalInfo.location && <p><strong>Location:</strong> {candidate.personalInfo.location}</p>}
                              {candidate.personalInfo.linkedin && <p><strong>LinkedIn:</strong> <a href={candidate.personalInfo.linkedin} target="_blank" rel="noopener noreferrer" className="text-primary underline">{candidate.personalInfo.linkedin}</a></p>}
                              {candidate.roleApplied?.role && (
                                <p><strong>Role Applied:</strong> {candidate.roleApplied.role}</p>
                              )}
                            </div>
                          </div>

                          {/* Professional Info */}
                          <div>
                            <h3 className="font-semibold mb-3">Professional Info</h3>
                            <div className="space-y-1 text-sm">
                              {candidate.professionalInfo.currentTitle && <p><strong>Current Title:</strong> {candidate.professionalInfo.currentTitle}</p>}
                              {candidate.professionalInfo.yearsOfExperience && <p><strong>Experience:</strong> {candidate.professionalInfo.yearsOfExperience}</p>}
                              {candidate.professionalInfo.education && <p><strong>Education:</strong> {candidate.professionalInfo.education}</p>}
                              {candidate.professionalInfo.certifications && candidate.professionalInfo.certifications.length > 0 && (
                                <p><strong>Certifications:</strong> {candidate.professionalInfo.certifications.join(", ")}</p>
                              )}
                            </div>
                          </div>

                          {/* Summary */}
                          {candidate.professionalSummary && (
                          <div>
                            <h3 className="font-semibold mb-3">Professional Summary</h3>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                {candidate.professionalSummary}
                            </p>
                          </div>
                          )}

                          {/* Skills */}
                          <div>
                            <h3 className="font-semibold mb-3">Technical Skills</h3>
                            <div className="flex flex-wrap gap-2">
                              {(candidate.technicalSkills || []).map((skill, index) => (
                                <Badge key={index} variant="secondary">
                                  {skill}
                                </Badge>
                              ))}
                            </div>
                            <h3 className="font-semibold mb-3 mt-4">Soft Skills</h3>
                            <div className="flex flex-wrap gap-2">
                              {(candidate.softSkills || []).map((skill, index) => (
                                <Badge key={index} variant="outline">
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
                              {(candidate.workExperience || []).map((exp, index) => (
                                <div key={index} className="border-l-2 border-primary/20 pl-4">
                                  <h4 className="font-medium">{exp.title}</h4>
                                  <p className="text-sm text-muted-foreground">{exp.company} {exp.years ? `• ${exp.years}` : ""}</p>
                                  <p className="text-sm mt-2 leading-relaxed">{exp.description}</p>
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
            {/* Pagination Controls */}
            {!searchMode && totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-8">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 1 || loading}
                  onClick={() => handlePageChange(page - 1)}
                >
                  Previous
                </Button>
                {[...Array(totalPages)].map((_, idx) => (
                  <Button
                    key={idx+1}
                    variant={page === idx+1 ? "default" : "outline"}
                    size="sm"
                    disabled={loading}
                    onClick={() => handlePageChange(idx+1)}
                  >
                    {idx+1}
                  </Button>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === totalPages || loading}
                  onClick={() => handlePageChange(page + 1)}
                >
                  Next
                </Button>
              </div>
            )}
            {filteredCandidates.length === 0 && !loading && !error && (
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