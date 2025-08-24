export const testApiEndpoints = () => ({
  auth: {
    login: '/api/auth/login',
    register: '/api/auth/register',
    logout: '/api/auth/logout',
    refresh: '/api/auth/refresh',
  },
  files: {
    list: '/api/files',
    upload: '/api/files/upload',
    download: '/api/files/download',
    delete: '/api/files/delete',
    rename: '/api/files/rename',
    move: '/api/files/move',
    share: '/api/files/share',
  },
  folders: {
    create: '/api/folders/create',
    list: '/api/folders/list',
    delete: '/api/folders/delete',
    rename: '/api/folders/rename',
    move: '/api/folders/move',
  },
  search: {
    files: '/api/search/files',
    folders: '/api/search/folders',
  },
  storage: {
    usage: '/api/storage/usage',
    quota: '/api/storage/quota',
  },
});