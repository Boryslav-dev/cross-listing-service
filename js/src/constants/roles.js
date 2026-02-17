/**
 * Workspace role constants
 */
export const ROLE_OWNER = 'owner'
export const ROLE_ADMIN = 'admin'
export const ROLE_MANAGER = 'manager'
export const ROLE_CONTENT = 'content'
export const ROLE_VIEWER = 'viewer'

/**
 * Array of all available roles
 */
export const ALL_ROLES = [
  ROLE_OWNER,
  ROLE_ADMIN,
  ROLE_MANAGER,
  ROLE_CONTENT,
  ROLE_VIEWER,
]

/**
 * Get roles available for invitation based on the actor's role
 */
export function getInviteRoles(actorRole) {
  if (actorRole === ROLE_MANAGER) {
    return [ROLE_CONTENT, ROLE_VIEWER]
  }
  if (actorRole === ROLE_ADMIN) {
    return [ROLE_ADMIN, ROLE_MANAGER, ROLE_CONTENT, ROLE_VIEWER]
  }
  return ALL_ROLES
}

/**
 * Get roles available for updating a member's role based on the actor's role
 */
export function getUpdateRoles(actorRole) {
  if (actorRole === ROLE_ADMIN) {
    return [ROLE_ADMIN, ROLE_MANAGER, ROLE_CONTENT, ROLE_VIEWER]
  }
  return ALL_ROLES
}
