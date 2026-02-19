import http from './http'

export async function listProducts(workspaceId, params = {}) {
  const { data } = await http.get(`/api/v1/workspaces/${workspaceId}/products`, { params })
  return data
}

export async function createProduct(workspaceId, payload) {
  const { data } = await http.post(`/api/v1/workspaces/${workspaceId}/products`, payload)
  return data
}

export async function getProduct(workspaceId, productId) {
  const { data } = await http.get(`/api/v1/workspaces/${workspaceId}/products/${productId}`)
  return data
}

export async function updateProduct(workspaceId, productId, payload) {
  const { data } = await http.patch(`/api/v1/workspaces/${workspaceId}/products/${productId}`, payload)
  return data
}

export async function deleteProduct(workspaceId, productId) {
  const { data } = await http.delete(`/api/v1/workspaces/${workspaceId}/products/${productId}`)
  return data
}

export async function uploadProductImage(workspaceId, file) {
  const formData = new FormData()
  formData.append('image', file)
  const { data } = await http.post(`/api/v1/workspaces/${workspaceId}/uploads/products`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}
