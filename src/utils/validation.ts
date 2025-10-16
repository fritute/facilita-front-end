// Utilitários de validação

import { VALIDATION } from '../config/constants'

/**
 * Valida se um email é válido
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Valida se uma senha é forte
 */
export const validatePassword = (password: string): { valid: boolean; message: string } => {
  if (password.length < VALIDATION.MIN_PASSWORD_LENGTH) {
    return { valid: false, message: `Senha deve ter no mínimo ${VALIDATION.MIN_PASSWORD_LENGTH} caracteres` }
  }
  
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'Senha deve conter pelo menos uma letra maiúscula' }
  }
  
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: 'Senha deve conter pelo menos uma letra minúscula' }
  }
  
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: 'Senha deve conter pelo menos um número' }
  }
  
  return { valid: true, message: 'Senha válida' }
}

/**
 * Valida se um CEP é válido
 */
export const isValidCEP = (cep: string): boolean => {
  const cleanCEP = cep.replace(/\D/g, '')
  return cleanCEP.length === 8
}

/**
 * Valida se um telefone é válido
 */
export const isValidPhone = (phone: string): boolean => {
  const cleanPhone = phone.replace(/\D/g, '')
  return cleanPhone.length >= VALIDATION.MIN_PHONE_LENGTH
}

/**
 * Valida se um arquivo é uma imagem válida
 */
export const isValidImageFile = (file: File): { valid: boolean; message: string } => {
  if (!VALIDATION.ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    return { valid: false, message: 'Tipo de arquivo inválido. Use apenas imagens.' }
  }
  
  const maxSizeBytes = VALIDATION.MAX_FILE_SIZE_MB * 1024 * 1024
  if (file.size > maxSizeBytes) {
    return { valid: false, message: `Arquivo muito grande. Máximo ${VALIDATION.MAX_FILE_SIZE_MB}MB.` }
  }
  
  return { valid: true, message: 'Arquivo válido' }
}

/**
 * Valida se um nome é válido
 */
export const isValidName = (name: string): boolean => {
  return name.trim().length >= VALIDATION.MIN_NAME_LENGTH
}
