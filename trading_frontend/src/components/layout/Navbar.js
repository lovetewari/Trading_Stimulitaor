import React from 'react';
import {
    AppBar,
    Toolbar,
    Typography,
    Button,
    Box,
    Container,
    IconButton,
    useMediaQuery,
    useTheme,
    Menu,
    MenuItem,
    Divider,
} from '@mui/material';
import {
    Dashboard,
    TrendingUp,
    AccountBalance,
    Menu as MenuIcon,
    SearchRounded,
    Logout as LogoutIcon,
    Person as PersonIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import StockSearch from '../common/StockSearch';

const Navbar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, logout } = useAuth();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const [mobileMenuAnchor, setMobileMenuAnchor] = React.useState(null);
    const [showSearch, setShowSearch] = React.useState(false);
    const [userMenu, setUserMenu] = React.useState(null);

    const isActive = (path) => location.pathname === path;

    const handleLogout = () => {
        logout();
        navigate('/login');
        handleUserMenuClose();
        handleMobileMenuClose();
    };

    const handleMobileMenuOpen = (event) => {
        setMobileMenuAnchor(event.currentTarget);
    };

    const handleMobileMenuClose = () => {
        setMobileMenuAnchor(null);
    };

    const handleUserMenuOpen = (event) => {
        setUserMenu(event.currentTarget);
    };

    const handleUserMenuClose = () => {
        setUserMenu(null);
    };

    const handleNavigate = (path) => {
        navigate(path);
        handleMobileMenuClose();
        handleUserMenuClose();
    };

    const navItems = user ? [
        { label: 'Dashboard', icon: <Dashboard />, path: '/dashboard' },
        { label: 'Trading', icon: <TrendingUp />, path: '/trading' },
        { label: 'Portfolio', icon: <AccountBalance />, path: '/portfolio' },
    ] : [
        { label: 'Login', path: '/login' },
        { label: 'Register', path: '/register' },
    ];

    return (
        <AppBar
            position="sticky"
            elevation={0}
            sx={{
                bgcolor: 'background.paper',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            }}
        >
            <Container maxWidth="xl">
                <Toolbar sx={{ minHeight: '48px !important', py: 1 }}>
                    {/* Logo/Title */}
                    <Typography
                        variant="h6"
                        component="div"
                        onClick={() => navigate('/')}
                        sx={{
                            fontSize: '16px',
                            color: 'primary.main',
                            cursor: 'pointer',
                            fontWeight: 600,
                            mr: 3,
                        }}
                    >
                        Trading Platform
                    </Typography>

                    {/* Search Bar - Desktop */}
                    {user && !isMobile && (
                        <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center', mx: 2 }}>
                            <StockSearch />
                        </Box>
                    )}

                    {/* Desktop Navigation */}
                    {!isMobile && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {navItems.map((item, index) => (
                                <Button
                                    key={index}
                                    color="inherit"
                                    onClick={() => handleNavigate(item.path)}
                                    startIcon={item.icon}
                                    sx={{
                                        textTransform: 'none',
                                        fontSize: '14px',
                                        px: 2,
                                        py: 1,
                                        borderRadius: 1,
                                        bgcolor: isActive(item.path) ? 'rgba(74, 158, 255, 0.1)' : 'transparent',
                                        color: isActive(item.path) ? 'primary.main' : 'text.primary',
                                        '&:hover': {
                                            bgcolor: 'rgba(74, 158, 255, 0.05)',
                                        },
                                    }}
                                >
                                    {item.label}
                                </Button>
                            ))}
                            {user && (
                                <>
                                    <IconButton
                                        onClick={handleUserMenuOpen}
                                        sx={{
                                            ml: 1,
                                            color: Boolean(userMenu) ? 'primary.main' : 'inherit',
                                        }}
                                    >
                                        <PersonIcon />
                                    </IconButton>
                                    <Menu
                                        anchorEl={userMenu}
                                        open={Boolean(userMenu)}
                                        onClose={handleUserMenuClose}
                                        anchorOrigin={{
                                            vertical: 'bottom',
                                            horizontal: 'right',
                                        }}
                                        transformOrigin={{
                                            vertical: 'top',
                                            horizontal: 'right',
                                        }}
                                        PaperProps={{
                                            elevation: 0,
                                            sx: {
                                                mt: 1.5,
                                                overflow: 'visible',
                                                filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
                                                bgcolor: 'background.paper',
                                                '&:before': {
                                                    content: '""',
                                                    display: 'block',
                                                    position: 'absolute',
                                                    top: 0,
                                                    right: 14,
                                                    width: 10,
                                                    height: 10,
                                                    bgcolor: 'background.paper',
                                                    transform: 'translateY(-50%) rotate(45deg)',
                                                    zIndex: 0,
                                                },
                                            },
                                        }}
                                    >
                                        <MenuItem onClick={handleLogout}>
                                            <LogoutIcon sx={{ mr: 1 }} />
                                            Logout
                                        </MenuItem>
                                    </Menu>
                                </>
                            )}
                        </Box>
                    )}

                    {/* Mobile Controls */}
                    {isMobile && (
                        <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 1 }}>
                            {user && (
                                <IconButton
                                    color="inherit"
                                    onClick={() => setShowSearch(!showSearch)}
                                >
                                    <SearchRounded />
                                </IconButton>
                            )}
                            <IconButton
                                color="inherit"
                                edge="end"
                                onClick={handleMobileMenuOpen}
                            >
                                <MenuIcon />
                            </IconButton>
                        </Box>
                    )}
                </Toolbar>

                {/* Mobile Search Bar */}
                {user && isMobile && showSearch && (
                    <Box sx={{ px: 2, pb: 2 }}>
                        <StockSearch />
                    </Box>
                )}
            </Container>

            {/* Mobile Menu */}
            <Menu
                anchorEl={mobileMenuAnchor}
                open={Boolean(mobileMenuAnchor)}
                onClose={handleMobileMenuClose}
                anchorOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                }}
                PaperProps={{
                    sx: {
                        mt: 5,
                        minWidth: 200,
                        bgcolor: 'background.paper',
                    },
                }}
            >
                {navItems.map((item, index) => (
                    <MenuItem
                        key={index}
                        onClick={() => handleNavigate(item.path)}
                        sx={{
                            py: 1,
                            px: 2,
                            gap: 2,
                            color: isActive(item.path) ? 'primary.main' : 'inherit',
                        }}
                    >
                        {item.icon}
                        {item.label}
                    </MenuItem>
                ))}
                {user && (
                    <>
                        <Divider sx={{ my: 1 }} />
                        <MenuItem onClick={handleLogout} sx={{ py: 1, px: 2, gap: 2 }}>
                            <LogoutIcon />
                            Logout
                        </MenuItem>
                    </>
                )}
            </Menu>
        </AppBar>
    );
};

export default Navbar;