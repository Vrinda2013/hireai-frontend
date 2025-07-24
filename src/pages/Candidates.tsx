import { useState, useEffect, useRef } from "react"
import { Layout } from "@/components/Layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Search, Eye, Upload, User, Mail, Phone, Calendar, Briefcase, GraduationCap, Trash2, Filter, ChevronDown, MapPin } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

// Helper function to format date
const formatDate = (dateString: string) => {
  if (!dateString) return "Date not available"
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  } catch (error) {
    return "Invalid date"
  }
}

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
  status?: CandidateStatus
}

export type CandidateStatus = "in-progress" | "hold" | "accepted" | "rejected";

const statusConfig = {
  "in-progress": {
    label: "In Progress",
    color: "bg-blue-500 text-white",
    variant: "default" as const
  },
  "hold": {
    label: "On Hold",
    color: "bg-orange-500 text-white",
    variant: "secondary" as const
  },
  "accepted": {
    label: "Accepted",
    color: "bg-green-500 text-white",
    variant: "default" as const
  },
  "rejected": {
    label: "Rejected",
    color: "bg-red-500 text-white",
    variant: "destructive" as const
  }
};

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
  const [deletingCandidate, setDeletingCandidate] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const observer = useRef<HTMLDivElement | null>(null)
  const { toast } = useToast()

  // Delete candidate function
  const deleteCandidate = async (candidateId: string) => {
    setDeletingCandidate(candidateId)
    try {
      const response = await fetch(`http://localhost:3000/api/candidate-resumes/${candidateId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const result = await response.json()

      if (result.success) {
        // Remove the candidate from the local state
        setCandidates(prev => prev.filter(candidate => candidate._id !== candidateId))
        toast({
          title: "Success",
          description: "Candidate deleted successfully",
        })
      } else {
        throw new Error(result.message || "Failed to delete candidate")
      }
    } catch (error) {
      console.error('Error deleting candidate:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete candidate",
        variant: "destructive"
      })
    } finally {
      setDeletingCandidate(null)
    }
  }

  // Handle status change
  const handleStatusChange = (id: string, newStatus: CandidateStatus) => {
    setCandidates(prev => 
      prev.map(candidate => 
        candidate._id === id ? { ...candidate, status: newStatus } : candidate
      )
    );
    toast({
      title: "Status Updated",
      description: "Candidate status has been successfully updated.",
    });
  };

  // Fetch candidates for a page
  const fetchCandidates = (pageNum: number) => {
    setLoading(true)
    fetch(`http://localhost:3000/api/candidate-resumes?page=${pageNum}&limit=5`)
      .then(res => res.json())
      .then(data => {
        // Add default status to candidates if not present
        const candidatesWithStatus = (data.data || []).map((candidate: CandidateAPI) => ({
          ...candidate,
          status: candidate.status || "in-progress" as CandidateStatus
        }));
        setCandidates(candidatesWithStatus)
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
        // Add default status to candidates if not present
        const candidatesWithStatus = (data.data || []).map((candidate: CandidateAPI) => ({
          ...candidate,
          status: candidate.status || "in-progress" as CandidateStatus
        }));
        setCandidates(candidatesWithStatus)
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

  // Filter candidates based on search and status
  const filteredCandidates = candidates.filter(candidate => {
    const { personalInfo, professionalInfo, roleApplied, technicalSkills, softSkills } = candidate
    const search = searchTerm.toLowerCase()
    const matchesSearch = searchMode ? true : (
      personalInfo.fullName.toLowerCase().includes(search) ||
      personalInfo.email.toLowerCase().includes(search) ||
      (personalInfo.phone && personalInfo.phone.toLowerCase().includes(search)) ||
      (personalInfo.location && personalInfo.location.toLowerCase().includes(search)) ||
      (professionalInfo.currentTitle && professionalInfo.currentTitle.toLowerCase().includes(search)) ||
      (roleApplied?.role && roleApplied.role.toLowerCase().includes(search)) ||
      (technicalSkills && technicalSkills.some(skill => skill.toLowerCase().includes(search))) ||
      (softSkills && softSkills.some(skill => skill.toLowerCase().includes(search)))
    );
    const matchesStatus = statusFilter === "all" || candidate.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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
      <div className="w-full px-8 space-y-6">
        {/* Search and Filter Section */}
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
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
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="in-progress">In Progress</SelectItem>
              <SelectItem value="hold">On Hold</SelectItem>
              <SelectItem value="accepted">Accepted</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" className="gap-2" onClick={handleSearch}>
            Search
                </Button>
            </div>

        {/* Candidate Database Section */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-foreground mb-4">Candidate Database</h2>
          
            {loading && (
              <div className="text-center py-12 text-muted-foreground">Loading candidates...</div>
            )}
            {error && (
              <div className="text-center py-12 text-destructive">{error}</div>
            )}
          
            <div className="space-y-4">
            {filteredCandidates.map((candidate) => {
              const statusInfo = statusConfig[candidate.status || "in-progress"];
              return (
                <Card key={candidate._id} className="p-5 hover:shadow-md transition-shadow w-full">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="candidate-avatar-custom w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0">
                        {/* Custom filled person SVG icon, blue color to match theme */}
                        <svg width="28" height="28" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <circle cx="12" cy="8" r="4" style={{ fill: '#0052CC' }} />
                          <path d="M4 20c0-2.21 3.58-4 8-4s8 1.79 8 4v1H4v-1z" style={{ fill: '#0052CC' }} />
                        </svg>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="font-semibold text-lg text-foreground truncate">{candidate.personalInfo.fullName}</h3>
                          <Badge className={cn("text-xs font-medium flex-shrink-0", statusInfo.color)}>
                            {statusInfo.label}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4 flex-shrink-0" />
                            <span className="truncate">{candidate.personalInfo.email}</span>
                        </div>
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4 flex-shrink-0" />
                            <span className="truncate">{candidate.personalInfo.phone}</span>
                        </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 flex-shrink-0" />
                            <span className="truncate">{candidate.personalInfo.location || "Location not specified"}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 flex-shrink-0" />
                            <span className="truncate">{formatDate(candidate.createdAt || "")}</span>
                          </div>
                        </div>

                        <div className="mb-3">
                          <div className="text-sm">
                            <span className="font-medium text-foreground">{candidate.professionalInfo.currentTitle || "No title specified"}</span>
                            <span className="text-muted-foreground ml-2">• {candidate.roleApplied?.role || "No role specified"}</span>
                      </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {/* Combine all skills and show only first 7 */}
                          {[
                            ...(candidate.technicalSkills || []),
                            ...(candidate.softSkills || [])
                          ].slice(0, 7).map((skill, index) => (
                            <Badge key={index} variant="secondary" className="text-xs px-2 py-1">
                              {skill}
                            </Badge>
                          ))}
                          {/* Show "+X more" if there are more than 7 skills */}
                          {((candidate.technicalSkills?.length || 0) + (candidate.softSkills?.length || 0)) > 7 && (
                            <Badge variant="outline" className="text-xs px-2 py-1">
                              +{((candidate.technicalSkills?.length || 0) + (candidate.softSkills?.length || 0)) - 7} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 ml-4 flex-shrink-0">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs">
                            Status
                            <ChevronDown className="w-3 h-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuItem onClick={() => handleStatusChange(candidate._id, "in-progress")}>
                            <div className="w-2.5 h-2.5 rounded-full bg-blue-500 mr-2"></div>
                            In Progress
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleStatusChange(candidate._id, "hold")}>
                            <div className="w-2.5 h-2.5 rounded-full bg-orange-500 mr-2"></div>
                            On Hold
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleStatusChange(candidate._id, "accepted")}>
                            <div className="w-2.5 h-2.5 rounded-full bg-green-500 mr-2"></div>
                            Accepted
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleStatusChange(candidate._id, "rejected")}>
                            <div className="w-2.5 h-2.5 rounded-full bg-red-500 mr-2"></div>
                            Rejected
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>

                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedCandidate(candidate)}
                            className="gap-1.5 h-8 text-xs"
                          >
                            <Eye className="w-3 h-3" />
                            Details
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
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

                      <AlertDialog open={deleteDialogOpen === candidate._id} onOpenChange={(open) => setDeleteDialogOpen(open ? candidate._id : null)}>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={deletingCandidate === candidate._id || loading}
                            className="gap-1.5 h-8 text-xs text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Candidate</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete {candidate.personalInfo.fullName}? This action cannot be undone and will permanently remove all candidate data.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel disabled={deletingCandidate === candidate._id}>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={async () => {
                                await deleteCandidate(candidate._id)
                                setDeleteDialogOpen(null)
                              }}
                              disabled={deletingCandidate === candidate._id}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              {deletingCandidate === candidate._id ? (
                                <>
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                  Deleting...
                                </>
                              ) : (
                                "Delete Candidate"
                              )}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </Card>
              );
            })}
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
        </div>
      </div>
    </Layout>
  )
}