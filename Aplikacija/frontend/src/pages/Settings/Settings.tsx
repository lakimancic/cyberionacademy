import { Avatar } from '@mui/material';
import { MdCloudUpload } from "react-icons/md";
import { BsTrash3Fill } from "react-icons/bs";
import { useRef } from 'react';
import './Settings.css';

function Settings() {
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    return (
        <div className="settings">
            <h1>User Account Settings</h1>
            <div className="settings-avatar">
                <div className="settings-avatar-info">
                    <Avatar></Avatar>
                    <div className="settings-avatar-text">
                        <h2>Upload your Avatar</h2>
                        <p>The maximum size of an image is 2MB.</p>
                        <p>We support .png .jpg .jpeg.</p>
                        <p className='settings-avatar-error'>Invalid image uploaded!</p>
                    </div>
                </div>
                <div className="settings-avatar-buttons">
                    <button type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className='settings-avatar-upload'
                    >
                        <MdCloudUpload /> 
                        Upload avatar
                        <input
                            type="file"
                            ref={fileInputRef}
                            style={{ display: 'none' }}
                            accept=".jpg,.png,.jpeg"
                        />
                    </button>
                    <button type="button" className='settings-avatar-delete'><BsTrash3Fill /></button>
                </div>
            </div>
        </div>
    )
}

export default Settings;