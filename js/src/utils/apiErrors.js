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

export function buildFormErrorMessage(error) {
  const status = error?.response?.status

  if (status === 429) {
    return 'Слишком много попыток, попробуйте позже.'
  }

  if (status === 401) {
    return 'Неверные учетные данные.'
  }

  if (status === 422) {
    return error?.response?.data?.message ?? 'Проверьте введенные данные.'
  }

  return 'Произошла ошибка сервера. Попробуйте позже.'
}
