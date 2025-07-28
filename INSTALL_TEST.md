# 安装脚本测试指南

本文档提供了 `install.sh` 脚本的测试方法和验证步骤。

## 脚本验证

### 1. 语法检查
```bash
# 检查脚本语法是否正确
bash -n install.sh
```

### 2. 基本功能测试
```bash
# 设置执行权限
chmod +x install.sh

# 测试帮助命令
./install.sh help

# 测试状态命令（无需 root）
./install.sh status
```

### 3. 依赖检查测试
```bash
# 在没有必要工具的系统上测试依赖检查
# 脚本应该能正确识别缺失的工具并给出提示
```

## Linux 环境完整测试

### 测试环境要求
- Linux x86_64 系统
- root 权限
- 网络连接

### 安装测试步骤

1. **新安装测试**
```bash
# 在全新系统上测试安装
sudo ./install.sh install

# 验证安装结果
./install.sh status
systemctl status storkitty
curl http://localhost:3330
```

2. **更新测试**
```bash
# 模拟已有旧版本的情况
# 再次运行安装脚本
sudo ./install.sh install

# 验证更新是否成功
./install.sh status
```

3. **卸载测试**
```bash
# 测试卸载功能
sudo ./install.sh uninstall

# 验证卸载结果
./install.sh status
systemctl status storkitty  # 应该显示未找到服务
```

### 权限验证
- 检查服务是否以当前用户运行
- 验证文件权限设置是否正确
- 确认安全策略是否生效

### 配置验证
- 检查配置文件是否正确创建
- 验证上传目录权限设置
- 测试默认登录账号

### 服务验证
- 验证 systemd 服务是否正确注册
- 测试服务的启动、停止、重启
- 检查服务日志输出

## 错误处理测试

### 网络错误
- 断网情况下运行脚本
- GitHub API 不可访问时的处理

### 权限错误
- 非 root 用户运行需要权限的命令
- 文件系统权限不足的情况

### 系统环境错误
- 不支持的系统架构
- 缺少必要的系统工具

## 预期结果

### 成功安装后应具备：
1. ✅ Storkitty 二进制文件安装在 `/etc/storkitty/`
2. ✅ 配置文件创建在 `/etc/storkitty/config.toml`
3. ✅ 数据目录创建在 `/etc/storkitty/uploads/`
4. ✅ systemd 服务文件创建并启用
5. ✅ 服务正常运行在端口 3330
6. ✅ 可以通过浏览器访问 http://localhost:3330
7. ✅ 默认账号 admin/admin123 可以正常登录

### 安全检查项：
1. 🔒 服务以当前用户运行
2. 🔒 文件权限设置正确
3. 🔒 systemd 安全策略生效
4. 🔒 只有必要的目录具有写权限

## 常见问题排查

### 服务启动失败
```bash
# 查看详细日志
journalctl -u storkitty -f

# 检查配置文件语法
# 检查端口是否被占用
netstat -tulnp | grep 3330
```

### 权限问题
```bash
# 检查文件所有者
ls -la /etc/storkitty/

# 检查当前用户
whoami
id $(whoami)
```

### 网络连接问题
```bash
# 测试 GitHub API 连接
curl -s https://api.github.com/repos/AlanLang/storkitty/releases/latest

# 检查防火墙设置
ufw status
iptables -L
```