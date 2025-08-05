import { useNavigate, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { FaEdit, FaExternalLinkAlt, FaPlus, FaTrashAlt } from 'react-icons/fa';
import InputField from '@/components/Auth/InputField';
import { FormControlLabel, MenuItem, Select, Slider, Switch } from '@mui/material';
import difficulties from '@/utils/difficulties';
import { MdQuiz } from 'react-icons/md';
import '@/assets/css/ModCreate.css';
import { IoIosSave } from 'react-icons/io';

const getColor = (val: number) => {
    if (val < 3) return 'success.main';
    if (val < 7) return 'warning.main';
    return 'error.main';
};

const getColorHex = (val: number) => {
    if (val < 3) return '#66bb6a';
    if (val < 7) return '#ffa726';
    return '#f44336';
};

function CreateLesson() {
    const [diffValue, setDiffValue] = useState(0);
    const params = useParams();
    const [selectedCategory, setSelectedCategory] = useState<string>('');
    const [categories, setCategories] = useState<string[]>([]);
    const navigate = useNavigate();
    
    useEffect(() => {
        api.get('/Challenge/GetCategories')
            .then(res => setCategories(res.data))
            .catch(err => console.error('Greška pri dohvatanju kategorija', err));
    }, []);

    return (
        <div className="studio-create">
            <h1>{params.id ? 'Edit' : 'Create'} Lesson</h1>
            <form className="studio-create-form">
                <h2>
                    Lesson Information
                    <a href={`/lessons/${params.id}`} target='_blank' rel='noopener noreferrer'><FaExternalLinkAlt /></a>
                </h2>
                <div className="studio-create-col">
                    <InputField
                        type='text'
                        label='Title'
                        handleChange={() => {}}
                        // error={basicForm.formState.errors.username?.message}
                        // inputProps={{...basicForm.register('username')}}
                    />
                    <div className="form-field studio-create-desc">
                        <div className="form-label">Description</div>
                        <textarea
                            className={/*basicForm.formState.errors.bio*/false ? 'form-input-error' : 'form-input-normal'}
                            spellCheck={false}
                            // onKeyUp={() => handleBasicChange('bio')}
                            // {...basicForm.register('bio')}
                        ></textarea>
                        {/* <div className={`form-error ${basicForm.formState.errors.bio ? '' : 'form-hidden'}`}>{basicForm.formState.errors.bio?.message ?? ''}</div> */}
                    </div>
                </div>
                <div className="studio-create-col">
                    <div className="form-field">
                        <div className="form-label">Difficulty</div>
                        <Slider
                            value={diffValue}
                            onChange={(_, val) => setDiffValue(val) }
                            aria-label="Difficulty"
                            defaultValue={30}
                            getAriaValueText={val => difficulties[val]}
                            valueLabelFormat={val => difficulties[val]}
                            valueLabelDisplay="auto"
                            shiftStep={3}
                            step={1}
                            marks
                            min={0}
                            max={9}
                            sx={{
                                color: getColor(diffValue)
                            }}
                        />
                        <div 
                            className="form-value-show"
                            style={{
                                color: getColorHex(diffValue)
                            }}
                        >{difficulties[diffValue]}</div>
                    </div>
                    <div className="studio-create-switches">
                        <div className="studio-create-full form-switch-con">
                            <div className="form-label">Visibility</div>
                            <FormControlLabel control={<Switch defaultChecked />} label="Label" />
                        </div>
                    </div>
                    <div className="form-field">
                        <div className="form-label">Category</div>
                        <Select
                            value={selectedCategory}
                            displayEmpty
                            onChange={e => setSelectedCategory(e.target.value)}
                            renderValue={selected => {
                                if(selected.length === 0)
                                    return <span className='admin-placeholder'>Select Category</span>;

                                return selected;
                            }}
                            >
                                {categories.map((cat, idx) => (<MenuItem key={idx} value={cat}>
                                    {cat}
                                </MenuItem>))}
                        </Select>
                    </div>
                </div>
                <div className="studio-create-sync"></div>
                <div className="studio-create-col">
                    <div className="form-field">
                        <div className="form-label">Lesson Content</div>
                        <div className="studio-upload-con">
                            <button type="button" onClick={() => navigate("/moderator/lesson-editor")}><FaEdit />  Open Editor</button>
                            <p className='studio-no-upload'>No content</p>
                        </div>
                    </div>
                </div>
                <div className="studio-create-col">
                    <div className="form-field">
                        <div className="form-label">Quiz</div>
                        <div className="studio-upload-con">
                            <button type="button"><MdQuiz />  Quiz Maker</button>
                            <p className='studio-no-upload'>No quiz</p>
                        </div>
                    </div>
                </div>
                <div className="studio-create-buttons">
                    <button type="button" className='studio-btn-add'><FaPlus /> Create</button>
                    <button type="button" className='studio-btn-save'><IoIosSave /> Save Changes</button>
                    <button type="button" className='studio-btn-del'><FaTrashAlt /> Delete</button>
                </div>
            </form>
        </div>
    )
}

export default CreateLesson;