import { useParams } from 'react-router-dom';
import InputField from '@/components/Auth/InputField';
import { FormControlLabel, MenuItem, Select, Slider, Switch } from '@mui/material';
import difficulties from '@/utils/difficulties';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { MdCloudUpload } from 'react-icons/md';
import { FaExternalLinkAlt, FaPlus, FaTrashAlt } from 'react-icons/fa';
import { IoIosSave, IoMdBuild } from 'react-icons/io';
import '@/assets/css/ModCreate.css';

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

const pointsValues = [
    { start: 50, step: 10 },
    { start: 100, step: 10 },
    { start: 150, step: 10 },
    { start: 200, step: 20 },
    { start: 300, step: 20 },
    { start: 400, step: 20 },
    { start: 500, step: 20 },
    { start: 600, step: 50 },
    { start: 850, step: 50 },
    { start: 1100, step: 100 }
];

function CreateChallenge() {
    const [diffValue, setDiffValue] = useState(0);
    const [points, setPoints] = useState(50);
    const params = useParams();
    const [selectedCategory, setSelectedCategory] = useState<string>('');
    const [categories, setCategories] = useState<string[]>([]);
    
    useEffect(() => {
        api.get('/Challenge/GetCategories')
            .then(res => setCategories(res.data))
            .catch(err => console.error('Greška pri dohvatanju kategorija', err));
    }, []);

    return (
        <div className="studio-create">
            <h1>{params.id ? 'Edit' : 'Create'} Challenge</h1>
            <form className="studio-create-form">
                <h2>
                    Challenge Information
                    <a href={`/challenges/${params.id}`} target='_blank' rel='noopener noreferrer'><FaExternalLinkAlt /></a>
                </h2>
                <div className="studio-create-col">
                    <InputField
                        type='text'
                        label='Name'
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
                    <InputField
                        type='text'
                        label='Flag'
                        handleChange={() => {}}
                        // error={basicForm.formState.errors.username?.message}
                        // inputProps={{...basicForm.register('username')}}
                    />
                </div>
                <div className="studio-create-col">
                    <div className="form-field">
                        <div className="form-label">Difficulty</div>
                        <Slider
                            value={diffValue}
                            onChange={(_, val) => {
                                setDiffValue(val);
                                setPoints(pointsValues[val].start);
                            }}
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
                    <div className="form-field">
                        <div className="form-label">Points</div>
                        <Slider
                            value={points}
                            onChange={(_, val) => setPoints(val)}
                            aria-label="Points"
                            defaultValue={50}
                            valueLabelDisplay="auto"
                            shiftStep={pointsValues[diffValue].step * 3}
                            step={pointsValues[diffValue].step}
                            marks
                            min={pointsValues[diffValue].start}
                            max={pointsValues[diffValue].start + pointsValues[diffValue].step * 4}
                        />
                        <div className="form-value-show">{points}pts</div>
                    </div>
                    <div className="studio-create-switches">
                        <div className="studio-create-col form-switch-con">
                            <div className="form-label">Visibility</div>
                            <FormControlLabel control={<Switch defaultChecked />} label="Label" />
                        </div>
                        <div className="studio-create-col form-switch-con">
                            <div className="form-label">Status</div>
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
                <h2>Upload Information</h2>
                <div className="studio-create-col">
                    <div className="form-field">
                        <div className="form-label">Docker Zip File (Containing Dockerfile)</div>
                        <div className="studio-upload-con">
                            <button type="button"><MdCloudUpload />  Upload</button>
                            <p className='studio-no-upload'>No file upload</p>
                        </div>
                        <input
                            type="file"
                            // ref={fileInputRef}
                            style={{ display: 'none' }}
                            accept=".zip"
                            // onChange={handleFileChange}
                        />
                    </div>
                </div>
                <div className="studio-create-col">
                    <div className="form-field">
                        <div className="form-label">Challenge Zip File (Available for user)</div>
                        <div className="studio-upload-con">
                            <button type="button"><MdCloudUpload />  Upload</button>
                            <p className='studio-no-upload'>No file upload</p>
                        </div>
                        <input
                            type="file"
                            // ref={fileInputRef}
                            style={{ display: 'none' }}
                            accept=".zip"
                            // onChange={handleFileChange}
                        />
                    </div>
                </div>
                <div className="studio-create-buttons">
                    <button type="button" className='studio-btn-add'><FaPlus /> Create</button>
                    <button type="button" className='studio-btn-save'><IoIosSave /> Save Changes</button>
                    <button type="button" className='studio-btn-del'><FaTrashAlt /> Delete</button>
                </div>
            </form>
            <div className="studio-create-con">
                <h2>Docker Image Builder</h2>
                <div className="studio-docker-con">
                    <h3>No docker image built</h3>
                    <div className="studio-docker-buttons">
                        <button type="button" className='studio-btn-add'><IoMdBuild /> Build</button>
                        <button type="button" className='studio-btn-del'><FaTrashAlt /> Delete</button>
                    </div>
                    <div className="form-label">Docker build Log</div>
                    <div className="studio-docker-logs">
                        
                    </div>
                </div>
            </div>
        </div>
    )
}

export default CreateChallenge;