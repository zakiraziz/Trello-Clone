import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createBoard } from '../api/createBoard'

const schema = z.object({
  name: z.string().min(1, 'Board name required'),
})

type CreateBoardFormValues = z.infer<typeof schema>

export const CreateBoardDialog = () => {
  const [open, setOpen] = useState(false)
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateBoardFormValues>({
    resolver: zodResolver(schema),
  })
  const queryClient = useQueryClient()

  const { mutate, isPending } = useMutation({
    mutationFn: createBoard,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boards'] })
      toast.success('Board created! 🎉')
      setOpen(false)
      reset()
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to create board')
    },
  })

  const onSubmit = (data: CreateBoardFormValues) => {
    mutate(data)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button type="button" className="flex items-center justify-center h-[100px] border-2 border-dashed rounded-lg hover:border-primary transition-colors" aria-label="Create a new board">
          <Plus className="w-8 h-8 text-muted-foreground" />
          <span className="ml-2 text-sm font-medium">Create Board</span>
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Board</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            {...register('name')}
            placeholder="Board name"
            className={errors.name ? 'border-red-500' : ''}
          />
          {errors.name && (
            <p className="text-sm text-red-500">{errors.name.message || 'Board name is required'}</p>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Creating...' : 'Create'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}