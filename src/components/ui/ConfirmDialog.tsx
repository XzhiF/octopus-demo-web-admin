'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Modal } from './Modal'

export interface ConfirmDialogProps {
  open: boolean
  title?: string
  message: ReactNode
  confirmText?: string
  cancelText?: string
  danger?: boolean
  onConfirm: () => void | Promise<void>
  onCancel: () => void
}

/**
 * Confirmation modal that fires `onConfirm` at most once per opening.
 * The guard is reset when the dialog is reopened (and when the action rejects,
 * so the user can retry), which prevents double-submits from rapid clicks.
 */
export function ConfirmDialog({
  open,
  title = '请确认',
  message,
  confirmText = '确定',
  cancelText = '取消',
  danger = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const firedRef = useRef(false)
  const [pending, setPending] = useState(false)

  useEffect(() => {
    if (open) {
      firedRef.current = false
      setPending(false)
    }
  }, [open])

  const handleConfirm = async () => {
    if (firedRef.current) return
    firedRef.current = true
    setPending(true)
    try {
      await onConfirm()
    } catch {
      firedRef.current = false
      setPending(false)
    }
  }

  return (
    <Modal
      open={open}
      title={title}
      onClose={onCancel}
      onConfirm={() => {
        void handleConfirm()
      }}
      onCancel={onCancel}
      confirmText={confirmText}
      cancelText={cancelText}
      confirmLoading={pending}
      danger={danger}
      width={400}
    >
      <div className="text-slate-300">{message}</div>
    </Modal>
  )
}
