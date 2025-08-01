#!/bin/bash

# Storkitty 一键安装脚本
# 适用于 x86_64 Linux 系统

set -e

REPO="AlanLang/storkitty"
INSTALL_DIR="/etc/storkitty"
SERVICE_NAME="storkitty"
BINARY_NAME="storkitty"
USER="$(logname 2>/dev/null || echo $SUDO_USER)"
GROUP="$(id -gn $USER 2>/dev/null || echo $USER)"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查是否为 root 用户
check_root() {
    if [[ $EUID -ne 0 ]]; then
        log_error "此脚本需要 root 权限运行"
        log_info "请使用: sudo $0"
        exit 1
    fi
}

# 检测系统架构
check_arch() {
    local arch=$(uname -m)
    if [[ "$arch" != "x86_64" ]]; then
        log_error "不支持的系统架构: $arch"
        log_error "目前只支持 x86_64 Linux 系统"
        exit 1
    fi
}

# 检查必要工具
check_dependencies() {
    local deps=("curl" "systemctl" "tar")
    local missing=()
    
    for dep in "${deps[@]}"; do
        if ! command -v "$dep" &> /dev/null; then
            missing+=("$dep")
        fi
    done
    
    if [[ ${#missing[@]} -gt 0 ]]; then
        log_error "缺少必要工具: ${missing[*]}"
        log_info "请先安装这些工具，例如: apt-get install ${missing[*]} 或 yum install ${missing[*]}"
        exit 1
    fi
}

# 获取最新版本号（内部函数，不输出日志）
_get_latest_version_silent() {
    local api_url="https://api.github.com/repos/$REPO/releases/latest"
    local version=$(curl -s "$api_url" | grep '"tag_name":' | sed -E 's/.*"([^"]+)".*/\1/')
    
    if [[ -z "$version" ]]; then
        return 1
    fi
    
    echo "$version"
}

# 获取最新版本号
get_latest_version() {
    log_info "获取最新版本信息..." >&2
    local version=$(_get_latest_version_silent)
    
    if [[ -z "$version" ]]; then
        log_error "无法获取最新版本信息" >&2
        exit 1
    fi
    
    echo "$version"
}

# 检查当前安装版本
get_installed_version() {
    if [[ -f "$INSTALL_DIR/$BINARY_NAME" ]]; then
        local version=$($INSTALL_DIR/$BINARY_NAME --version 2>/dev/null | grep -o 'v[0-9.]*' || echo "")
        echo "$version"
    else
        echo ""
    fi
}

# 检查用户权限
check_user() {
    if [[ -z "$USER" ]]; then
        log_error "无法获取当前用户信息"
        exit 1
    fi
    
    log_info "将使用用户: $USER"
    log_info "将使用用户组: $GROUP"
}

# 下载并安装二进制文件
install_binary() {
    local version="$1"
    local download_url="https://github.com/$REPO/releases/download/$version/storkitty-$version-x86_64-unknown-linux-gnu.tar.gz"
    local temp_dir=$(mktemp -d)
    local tar_file="$temp_dir/storkitty.tar.gz"
    
    log_info "下载 Storkitty $version..."
    curl -L -o "$tar_file" "$download_url" || {
        log_error "下载失败"
        rm -rf "$temp_dir"
        exit 1
    }
    
    # 创建安装目录
    mkdir -p "$INSTALL_DIR"
    
    # 解压
    log_info "解压文件..."
    tar -xzf "$tar_file" -C "$temp_dir" || {
        log_error "解压失败"
        rm -rf "$temp_dir"
        exit 1
    }
    
    # 复制二进制文件
    cp "$temp_dir/$BINARY_NAME" "$INSTALL_DIR/" || {
        log_error "安装二进制文件失败"
        rm -rf "$temp_dir"
        exit 1
    }
    
    # 复制配置文件示例（如果存在）
    if [[ -f "$temp_dir/config.example.toml" ]]; then
        cp "$temp_dir/config.example.toml" "$INSTALL_DIR/" || {
            log_warning "复制配置文件示例失败"
        }
    fi
    
    # 设置权限
    chmod +x "$INSTALL_DIR/$BINARY_NAME"
    
    # 清理临时文件
    rm -rf "$temp_dir"
    
    log_success "二进制文件安装完成"
}

# 创建配置文件
create_config() {
    local config_file="$INSTALL_DIR/config.toml"
    local example_config="$INSTALL_DIR/config.example.toml"
    
    if [[ -f "$config_file" ]]; then
        log_info "配置文件已存在，跳过创建"
        setup_upload_directory "$config_file"
        return
    fi
    
    log_info "创建配置文件..."
    
    # 检查示例配置文件是否存在
    if [[ ! -f "$example_config" ]]; then
        log_error "未找到配置文件模板: $example_config"
        log_error "压缩包可能不完整或已损坏"
        exit 1
    fi
    
    # 重命名示例配置文件
    mv "$example_config" "$config_file" || {
        log_error "重命名配置文件失败"
        exit 1
    }
    
    log_info "使用压缩包中的配置文件模板"
    
    # 根据配置文件创建上传目录
    setup_upload_directory "$config_file"
    
    # 设置文件权限
    chown -R "$USER:$GROUP" "$INSTALL_DIR"
    
    log_success "配置文件创建完成"
    log_warning "请修改 JWT secret_key 以提高安全性"
    log_info "首次访问将自动引导您创建管理员账户"
}

# 解析配置文件中的上传目录并创建
setup_upload_directory() {
    local config_file="$1"
    
    if [[ ! -f "$config_file" ]]; then
        log_error "配置文件不存在: $config_file"
        return 1
    fi
    
    # 解析 root_directory 配置项
    local root_directory=$(grep '^root_directory' "$config_file" | sed 's/^root_directory[[:space:]]*=[[:space:]]*["'"'"']\?\([^"'"'"']*\)["'"'"']\?/\1/')
    
    if [[ -z "$root_directory" ]]; then
        log_warning "未找到 root_directory 配置，使用默认值"
        root_directory="./uploads"
    fi
    
    # 处理相对路径
    if [[ "$root_directory" == ./* ]]; then
        # 相对路径转换为基于安装目录的绝对路径
        root_directory="$INSTALL_DIR/${root_directory#./}"
    fi
    
    log_info "创建上传目录: $root_directory"
    
    # 创建目录
    mkdir -p "$root_directory" || {
        log_error "创建上传目录失败: $root_directory"
        return 1
    }
    
    # 设置权限
    chown -R "$USER:$GROUP" "$root_directory"
    
    log_success "上传目录创建完成: $root_directory"
}

# 创建 systemd 服务文件
create_service() {
    local service_file="/etc/systemd/system/$SERVICE_NAME.service"
    local config_file="$INSTALL_DIR/config.toml"
    
    log_info "创建 systemd 服务..."
    
    # 获取上传目录路径用于 systemd 权限配置
    local root_directory="$INSTALL_DIR"
    if [[ -f "$config_file" ]]; then
        local parsed_dir=$(grep '^root_directory' "$config_file" | sed 's/^root_directory[[:space:]]*=[[:space:]]*["'"'"']\?\([^"'"'"']*\)["'"'"']\?/\1/')
        if [[ -n "$parsed_dir" ]]; then
            if [[ "$parsed_dir" == ./* ]]; then
                root_directory="$INSTALL_DIR"
            else
                # 获取父目录以确保 systemd 有足够权限
                root_directory=$(dirname "$parsed_dir")
            fi
        fi
    fi
    
    cat > "$service_file" << EOF
[Unit]
Description=Storkitty File Management System
After=network.target
StartLimitIntervalSec=0

[Service]
Type=simple
Restart=always
RestartSec=1
User=$USER
Group=$GROUP
WorkingDirectory=$INSTALL_DIR
ExecStart=$INSTALL_DIR/$BINARY_NAME
Environment=RUST_LOG=info

# 安全设置
NoNewPrivileges=true
ProtectSystem=strict
ReadWritePaths=$root_directory
PrivateTmp=true

[Install]
WantedBy=multi-user.target
EOF
    
    # 重新加载 systemd
    systemctl daemon-reload
    
    log_success "systemd 服务创建完成"
}

# 启动服务
start_service() {
    log_info "启动 Storkitty 服务..."
    
    systemctl enable "$SERVICE_NAME"
    systemctl start "$SERVICE_NAME"
    
    # 等待服务启动
    sleep 2
    
    if systemctl is-active --quiet "$SERVICE_NAME"; then
        log_success "Storkitty 服务启动成功"
        log_info "服务状态: $(systemctl is-active $SERVICE_NAME)"
        log_info "访问地址: http://localhost:3330"
        log_info "首次访问将自动引导您完成系统设置"
    else
        log_error "Storkitty 服务启动失败"
        log_info "查看日志: journalctl -u $SERVICE_NAME -f"
        exit 1
    fi
}

# 停止服务
stop_service() {
    if systemctl is-active --quiet "$SERVICE_NAME"; then
        log_info "停止 Storkitty 服务..."
        systemctl stop "$SERVICE_NAME"
    fi
}

# 主安装函数
install_storkitty() {
    log_info "开始安装 Storkitty..."
    
    local latest_version=$(get_latest_version)
    local installed_version=$(get_installed_version)
    
    if [[ -n "$installed_version" ]]; then
        if [[ "$installed_version" == "$latest_version" ]]; then
            log_info "Storkitty $installed_version 已是最新版本"
            return
        else
            log_info "发现新版本: $latest_version (当前: $installed_version)"
            log_info "开始更新..."
            stop_service
        fi
    else
        log_info "检测到新安装，版本: $latest_version"
    fi
    
    check_user
    install_binary "$latest_version"
    create_config
    create_service
    start_service
    
    log_success "Storkitty 安装/更新完成！"
}

# 卸载函数
uninstall_storkitty() {
    log_info "开始卸载 Storkitty..."
    
    # 停止并禁用服务
    if systemctl is-enabled --quiet "$SERVICE_NAME" 2>/dev/null; then
        systemctl disable "$SERVICE_NAME"
    fi
    
    if systemctl is-active --quiet "$SERVICE_NAME"; then
        systemctl stop "$SERVICE_NAME"
    fi
    
    # 删除服务文件
    rm -f "/etc/systemd/system/$SERVICE_NAME.service"
    systemctl daemon-reload
    
    # 删除安装目录
    if [[ -d "$INSTALL_DIR" ]]; then
        rm -rf "$INSTALL_DIR"
    fi
    
    # 注意：保留用户数据目录 /var/lib/storkitty
    log_warning "用户数据保留在 /var/lib/storkitty，如需完全删除请手动处理"
    
    log_success "Storkitty 卸载完成"
}

# 显示状态
show_status() {
    log_info "Storkitty 状态信息："
    
    if [[ -f "$INSTALL_DIR/$BINARY_NAME" ]]; then
        local version=$(get_installed_version)
        echo "安装版本: ${version:-"未知"}"
        echo "安装目录: $INSTALL_DIR"
        echo "配置文件: $INSTALL_DIR/config.toml"
        echo "数据目录: /var/lib/storkitty"
        echo "服务状态: $(systemctl is-active $SERVICE_NAME 2>/dev/null || echo "未安装")"
        
        if systemctl is-active --quiet "$SERVICE_NAME"; then
            echo "访问地址: http://localhost:3330"
        fi
    else
        echo "未安装"
    fi
}

# 显示帮助信息
show_help() {
    echo "Storkitty 一键安装脚本"
    echo ""
    echo "使用方法:"
    echo "  sudo $0 [命令]"
    echo ""
    echo "命令:"
    echo "  install   安装或更新 Storkitty (默认)"
    echo "  uninstall 卸载 Storkitty"
    echo "  status    显示状态信息"
    echo "  help      显示此帮助信息"
    echo ""
    echo "示例:"
    echo "  sudo $0              # 安装或更新"
    echo "  sudo $0 install      # 安装或更新"
    echo "  sudo $0 uninstall    # 卸载"
    echo "  $0 status            # 显示状态（无需 root）"
    echo ""
}

# 主函数
main() {
    local command="${1:-install}"
    
    case "$command" in
        install)
            check_root
            check_arch
            check_dependencies
            install_storkitty
            ;;
        uninstall)
            check_root
            uninstall_storkitty
            ;;
        status)
            show_status
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            log_error "未知命令: $command"
            show_help
            exit 1
            ;;
    esac
}

# 运行主函数
main "$@"