import { useMemo, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { cn } from '../../utils/cn'
import { useAuth } from '../../auth/useAuth'
import { useWorkspace } from '../../workspaces/useWorkspace'
import { useI18n } from '../../i18n/useI18n'
import { IconButton, LanguageSwitcher } from '../ui'
import {
  MenuIcon,
  GroupIcon,
  HistoryIcon,
  SettingsIcon,
  LogoutIcon,
  UserCircleIcon,
  ExpandMoreIcon,
} from '../icons'
import { ROLE_OWNER } from '../../constants/roles'

function buildNavItems(t, currentWorkspace) {
  const isOwner = currentWorkspace?.current_role === ROLE_OWNER

  const items = [
    {
      key: 'members',
      label: t('workspace.menu_members'),
      icon: <GroupIcon size={18} />,
      to: '/app/members',
    },
    {
      key: 'audit',
      label: t('workspace.menu_audit'),
      icon: <HistoryIcon size={18} />,
      to: '/app/audit',
    },
  ]

  if (isOwner) {
    items.push({
      key: 'settings',
      label: t('workspace.menu_settings'),
      icon: <SettingsIcon size={18} />,
      to: '/app/settings',
    })
  }

  return items
}

function isNavItemActive(pathname, item) {
  if (item.exact) return pathname === item.to
  return pathname.startsWith(item.to)
}

export function AppLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()
  const { t } = useI18n()
  const [mobileOpen, setMobileOpen] = useState(false)

  const { currentWorkspace, currentWorkspaceId } = useWorkspace()

  const navItems = useMemo(() => buildNavItems(t, currentWorkspace), [t, currentWorkspace])

  const handleWorkspaceClick = () => {
    navigate('/app/workspaces')
    setMobileOpen(false)
  }

  const sidebarContent = (
    <div className="flex h-full flex-col">
      <div className="p-5">
        <span className="mb-2 block text-xs text-text-secondary">
          {t('workspace.switcher_label')}
        </span>
        <button
          onClick={handleWorkspaceClick}
          className="flex w-full items-center justify-between rounded-lg border border-border bg-surface px-3 py-2.5 text-left transition-all hover:border-primary hover:bg-primary/5"
        >
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-text-primary">
              {currentWorkspace?.name || t('workspace.no_workspaces_short')}
            </p>
            {currentWorkspace?.slug && (
              <p className="truncate text-xs text-text-secondary">@{currentWorkspace.slug}</p>
            )}
          </div>
          <ExpandMoreIcon size={18} className="ml-2 shrink-0 text-text-secondary" />
        </button>
      </div>

      <hr className="border-divider/60" />

      <nav className="flex-1 px-3 py-3">
        {navItems.map((item) => {
          const active = isNavItemActive(location.pathname, item)
          const disabled = !currentWorkspaceId

          return (
            <NavLink
              key={item.key}
              to={item.to}
              className={cn(
                'flex items-center gap-2.5 px-3 py-2 mb-1 text-sm rounded-md transition-all duration-150',
                active
                  ? 'bg-primary text-white font-semibold shadow-sm'
                  : 'text-text-primary hover:bg-gray-100 font-medium',
                disabled && 'opacity-40 pointer-events-none',
              )}
              onClick={() => setMobileOpen(false)}
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          )
        })}
      </nav>

      <hr className="border-divider/60" />

      <div className="p-5">
        <span className="text-xs text-text-secondary">{t('workspace.signed_as')}</span>
        <p className="mt-1 text-sm font-semibold break-words">{user?.email}</p>
      </div>
    </div>
  )

  return (
    <div className="flex min-h-screen bg-background">
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-[2px] md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar — mobile */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 w-[280px] bg-surface border-r border-divider/60 shadow-lg transform transition-transform duration-200 md:hidden',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {sidebarContent}
      </aside>

      {/* Sidebar — desktop */}
      <aside className="hidden md:block md:w-[280px] md:shrink-0 border-r border-divider/60 bg-surface">
        {sidebarContent}
      </aside>

      {/* Main content */}
      <div className="flex-1 min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-20 flex h-[66px] items-center border-b border-divider/60 bg-surface/80 backdrop-blur-sm px-4">
          <button
            className="mr-3 md:hidden p-1.5 rounded-full hover:bg-gray-100 transition-colors"
            onClick={() => setMobileOpen((prev) => !prev)}
          >
            <MenuIcon size={24} />
          </button>

          <h2 className="flex-1 text-lg font-bold">{t('workspace.admin_title')}</h2>

          <div className="flex items-center gap-1.5">
            <LanguageSwitcher compact />
            <IconButton
              onClick={() => navigate('/app/profile')}
              title={t('common.profile') || 'Profile'}
            >
              <UserCircleIcon size={20} />
            </IconButton>
            <IconButton onClick={logout} title={t('common.logout')}>
              <LogoutIcon size={20} />
            </IconButton>
          </div>
        </header>

        <main className="p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
