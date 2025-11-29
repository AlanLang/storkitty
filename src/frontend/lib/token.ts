export const TOKEN_KEY = "token";
export const token = {
  set: (token: string) => {
    localStorage.setItem(TOKEN_KEY, token);
  },
  get: () => {
    return localStorage.getItem(TOKEN_KEY);
  },
  remove: () => {
    localStorage.removeItem(TOKEN_KEY);
  },
};
