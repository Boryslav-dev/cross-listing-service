export function applyServerValidationErrors(error, setError) {
  const serverErrors = error?.response?.data?.errors

  if (!serverErrors || typeof serverErrors !== 'object') {
    return
  }

  Object.entries(serverErrors).forEach(([field, messages]) => {
    if (!field || !Array.isArray(messages) || !messages[0]) {
      return
    }

    setError(field, {
      type: 'server',
      message: String(messages[0]),
    })
  })
}

export function buildFormErrorMessage(error, t) {
  const status = error?.response?.status

  if (status === 429) {
    return t('errors.too_many_attempts')
  }

  if (status === 401) {
    return t('errors.invalid_credentials')
  }

  if (status === 422) {
    return error?.response?.data?.message ?? t('errors.invalid_data')
  }

  return t('errors.server')
}
