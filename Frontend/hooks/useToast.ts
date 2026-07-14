import { useCallback } from 'react'
import { toast as sonnerToast, type ExternalToast } from 'sonner'

export const useToast = () => {
  const success = useCallback((message: string, options?: ExternalToast) => {
    return sonnerToast.success(message, options)
  }, [])

  const error = useCallback((message: string, options?: ExternalToast) => {
    return sonnerToast.error(message, options)
  }, [])

  const info = useCallback((message: string, options?: ExternalToast) => {
    return sonnerToast.info(message, options)
  }, [])

  const warning = useCallback((message: string, options?: ExternalToast) => {
    return sonnerToast.warning(message, options)
  }, [])

  const loading = useCallback((message: string, options?: ExternalToast) => {
    return sonnerToast.loading(message, options)
  }, [])

  const dismiss = useCallback((toastId?: string | number) => {
    return sonnerToast.dismiss(toastId)
  }, [])

  return {
    toast: sonnerToast,
    success,
    error,
    info,
    warning,
    loading,
    dismiss,
  }
}
