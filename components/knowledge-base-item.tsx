"use client"

import { Button } from "@/components/ui/button"
import { FileText, Trash2, Download } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useState } from "react"
import { useToast } from "@/components/ui/use-toast"

interface KnowledgeBaseItemProps {
  id: string
  name: string
  date: string
  size: string
  onDelete?: () => void
}

export default function KnowledgeBaseItem({ id, name, date, size, onDelete }: KnowledgeBaseItemProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const { toast } = useToast()

  const handleDelete = async () => {
    setIsDeleting(true)

    try {
      const response = await fetch(`/api/knowledge-base/delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ file_id: id }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Error: ${response.status}`)
      }

      const data = await response.json()

      if (data.success) {
        toast({
          title: "File removed",
          description: `${name} has been removed from your knowledge base.`,
        })
        if (onDelete) {
          onDelete()
        }
      } else {
        throw new Error(data.error || "Failed to remove file")
      }
    } catch (error: any) {
      console.error("Error deleting file:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to remove file",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="flex items-center justify-between p-4 border rounded-lg">
      <div className="flex items-center space-x-3">
        <FileText className="h-5 w-5 text-muted-foreground" />
        <div>
          <p className="font-medium">{name}</p>
          <p className="text-sm text-muted-foreground">
            Added on {date} • {size}
          </p>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <Button variant="ghost" size="icon">
          <Download className="h-4 w-4" />
        </Button>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="icon">
              <Trash2 className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove from knowledge base?</AlertDialogTitle>
              <AlertDialogDescription>
                This will remove {name} from your custom GPT's knowledge base. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={isDeleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isDeleting ? "Removing..." : "Remove"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}
