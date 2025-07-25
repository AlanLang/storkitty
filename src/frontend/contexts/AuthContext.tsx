import {
  type ReactNode,
  createContext,
  useCallback,
  useEffect,
  useReducer,
} from "react";
import type {
  AuthAction,
  AuthState,
  LoginRequest,
  UserInfo,
} from "../types/auth";

const initialState: AuthState = {
  user: null,
  token: localStorage.getItem("token"),
  isAuthenticated: false,
  isLoading: true,
};

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case "LOGIN_START":
      return { ...state, isLoading: true };
    case "LOGIN_SUCCESS":
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
      };
    case "LOGIN_FAILURE":
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      };
    case "LOGOUT":
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      };
    case "SET_LOADING":
      return { ...state, isLoading: action.payload };
    default:
      return state;
  }
}

export interface AuthContextType {
  state: AuthState;
  login: (credentials: LoginRequest) => Promise<boolean>;
  logout: () => void;
  verifyToken: () => Promise<void>;
}

// biome-ignore lint/nursery/useComponentExportOnlyModules: <explanation>
export const AuthContext = createContext<AuthContextType | undefined>(
  undefined,
);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  const login = async (credentials: LoginRequest): Promise<boolean> => {
    dispatch({ type: "LOGIN_START" });

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (data.success && data.token) {
        localStorage.setItem("token", data.token);

        // 获取用户信息
        const userResponse = await fetch("/api/auth/verify", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${data.token}`,
          },
        });

        if (userResponse.ok) {
          const user: UserInfo = await userResponse.json();
          dispatch({
            type: "LOGIN_SUCCESS",
            payload: { user, token: data.token },
          });
          return true;
        }
      }

      dispatch({ type: "LOGIN_FAILURE", payload: data.message });
      return false;
    } catch (_error) {
      dispatch({ type: "LOGIN_FAILURE", payload: "网络错误" });
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    dispatch({ type: "LOGOUT" });
  };

  const verifyToken = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      dispatch({ type: "SET_LOADING", payload: false });
      return;
    }

    try {
      const response = await fetch("/api/auth/verify", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const user: UserInfo = await response.json();
        dispatch({
          type: "LOGIN_SUCCESS",
          payload: { user, token },
        });
      } else {
        localStorage.removeItem("token");
        dispatch({ type: "LOGOUT" });
      }
    } catch (_error) {
      localStorage.removeItem("token");
      dispatch({ type: "LOGOUT" });
    }

    dispatch({ type: "SET_LOADING", payload: false });
  }, []);

  useEffect(() => {
    verifyToken();
  }, [verifyToken]);

  const value: AuthContextType = {
    state,
    login,
    logout,
    verifyToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
