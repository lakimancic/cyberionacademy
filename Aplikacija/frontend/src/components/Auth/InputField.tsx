import { useRef, useState } from "react";
import { FiMinusCircle, FiPlusCircle } from "react-icons/fi";
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
    const inputRef = useRef<HTMLInputElement|null>(null);

    return (
        <div className="form-field">
            <div className="form-label">{props.label}</div>
            <div className={`form-input ${props.error ? 'form-eye-red' : ''}`}>
                <input
                    ref={inputRef}
                    type={passwordVisible ? 'text' : props.type}
                    {...props.inputProps}
                    onKeyUp={props.handleChange}
                    className={props.error ? 'form-input-error' : 'form-input-normal'}
                />
                {props.type === 'password' && (passwordVisible ? 
                    <IoEye    onClick={() => setPasswordVisible(false)}/> : 
                    <IoEyeOff onClick={() => setPasswordVisible(true)}/>
                )}
                {props.type === 'number' && <>
                    <FiPlusCircle className="form-number-inc" onClick={() => inputRef.current?.stepUp()} />
                    <FiMinusCircle className="form-number-dec" onClick={() => inputRef.current?.stepDown()} />
                </>}
            </div>
            <div className={`form-error ${props.error ? '' : 'form-hidden'}`}>{props.error ?? ''}</div>
        </div>
    )
}

export default InputField;