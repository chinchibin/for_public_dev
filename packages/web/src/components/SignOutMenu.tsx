import * as React from 'react';
import Button from '@mui/material/Button';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import Logout from '@mui/icons-material/Logout';
import { useCallback } from 'react';
import { Auth } from 'aws-amplify';
import {ReactComponent as DocumentIcon} from '../assets/document.svg';
import {ReactComponent as LogsIcon} from '../assets/logs.svg';

export default function SignOutMenu({ label }: { label: string }) {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const signOut = useCallback(async () => {
    await Auth.signOut();
  }, []);

  const handleClose = () => {
    handleExit()
    signOut();
  };

  const handleExit = () => {
    setAnchorEl(null);
  };

  const handleSkip = (path: string) => {
    location.href = path;
  }

  return (
    <div>
      <Button
        id="demo-positioned-button"
        aria-controls={open ? 'demo-positioned-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
        onClick={handleClick}
        style={{ textTransform: 'none' }}
      >
        {label}
      </Button>
      <Menu
        id="demo-positioned-menu"
        aria-labelledby="demo-positioned-button"
        anchorEl={anchorEl}
        open={open}
        onClose={handleExit}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
      >
        <MenuItem onClick={handleClose}>
          <ListItemIcon>
            <Logout fontSize="small" style={{ color: "var(--color-orange)" }} />
          </ListItemIcon>
          Log out
        </MenuItem>
        <MenuItem onClick={() => { handleSkip('/document'); }}>
          <ListItemIcon>
            <DocumentIcon></DocumentIcon>
          </ListItemIcon>
          ドキュメント一覧
        </MenuItem>
        <MenuItem onClick={() => { handleSkip('/log'); }}>
          <ListItemIcon>
            <LogsIcon></LogsIcon>
          </ListItemIcon>        
          利用ログ一覧
        </MenuItem>
        
      </Menu>
    </div>
  );
}