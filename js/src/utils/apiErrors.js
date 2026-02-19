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

  if (status === 403) {
    return t('errors.forbidden')
  }

  if (status === 404) {
    return t('errors.not_found')
  }

  if (status === 422) {
    // Show first human-readable field error if available, otherwise generic message
    const errors = error?.response?.data?.errors
    if (errors && typeof errors === 'object') {
      const firstKey = Object.keys(errors)[0]
      const firstMsg = errors[firstKey]?.[0]
      if (firstMsg) {
        return firstMsg
      }
    }
    return t('errors.invalid_data')
  }

  if (status >= 500) {
    return t('errors.server')
  }

  return t('errors.server')
}
