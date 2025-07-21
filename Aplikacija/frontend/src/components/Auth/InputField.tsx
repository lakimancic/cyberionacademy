import { useState } from "react";
import { IoEye, IoEyeOff } from "react-icons/io5";

type InputProps = {
    type: string;
    label: string;
    handleChange: () => void;
    error?: string;
    inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
};

function InputField(props : InputProps) {
    const [passwordVisible, setPasswordVisible] = useState(false);

    return (
        <div className="form-field">
            <div className="form-label">{props.label}</div>
            <div className={`form-input ${props.error ? 'form-eye-red' : ''}`}>
                <input
                    type={passwordVisible ? 'text' : props.type}
                    {...props.inputProps}
                    onKeyUp={props.handleChange}
                    className={props.error ? 'form-input-error' : 'form-input-normal'}
                />
                {props.type === 'password' && (passwordVisible ? 
                    <IoEye    onClick={() => setPasswordVisible(false)}/> : 
                    <IoEyeOff onClick={() => setPasswordVisible(true)}/>
                )}
            </div>
            <div className={`form-error ${props.error ? '' : 'form-hidden'}`}>{props.error ?? ''}</div>
        </div>
    )
}

export default InputField;