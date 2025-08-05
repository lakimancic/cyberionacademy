import { useParams } from 'react-router-dom';
import '@/assets/css/ModCreate.css';
import InputField from '@/components/Auth/InputField';
import { Checkbox, MenuItem, Radio, Select, Slider } from '@mui/material';
import { useState } from 'react';
import { FiPlus } from 'react-icons/fi';
import { MdDelete } from 'react-icons/md';
import { FaMinusCircle, FaPlus, FaPlusCircle, FaTrashAlt } from 'react-icons/fa';
import { IoIosSave } from 'react-icons/io';

const questionTypes = ['Single Answer', 'Multiple Answer', 'Connect Pairs', 'Text Answer'];

function CreateQuiz() {
    const [points, setPoints] = useState(50);
    const params = useParams();
    
    return (
        <div className="studio-create">
            <h1>{params.id ? 'Edit' : 'Create'} Quiz</h1>
            <form className="studio-create-form studio-form-quiz">
                <h2>
                    Quiz Information
                </h2>
                <div className="studio-create-col">
                    <InputField
                        type='number'
                        label='Questions Count in Quiz'
                        handleChange={() => {}}
                        // error={basicForm.formState.errors.username?.message}
                        // inputProps={{...basicForm.register('username')}}
                        inputProps={{
                            min: 5,
                            max: 120,
                            step: 1
                        }}
                    />
                </div>
            </form>
            <h2>Questions</h2>
            <div className="studio-quiz-quest">
                <div className="studio-quiz-delete-con">
                    <MdDelete />
                </div>
                <div className="form-field">
                    <div className="form-label">Question Text</div>
                    <textarea
                        className={/*basicForm.formState.errors.bio*/false ? 'form-input-error' : 'form-input-normal'}
                        spellCheck={false}
                        // onKeyUp={() => handleBasicChange('bio')}
                        // {...basicForm.register('bio')}
                    ></textarea>
                    {/* <div className={`form-error ${basicForm.formState.errors.bio ? '' : 'form-hidden'}`}>{basicForm.formState.errors.bio?.message ?? ''}</div> */}
                </div>
                <div className="form-field">
                    <div className="form-label">Answers (Select correct one)</div>
                    <div className="studio-answer-grid">
                        <>
                            <div className="studio-quiz-answer">
                                <input type="text" className='studio-single-answer form-input-normal' />
                                <Radio
                                    name="radio-buttons"
                                />
                            </div>
                            <div className="studio-quiz-remove">
                                <FaMinusCircle />
                            </div>
                        </>
                        <>
                            <div className="studio-quiz-answer">
                                <input type="text" className='studio-single-answer form-input-normal' />
                                <Radio
                                    name="radio-buttons"
                                />
                            </div>
                            <div className="studio-quiz-remove">
                                <FaMinusCircle />
                            </div>
                        </>
                        <>
                            <div className="studio-quiz-empty"></div>
                            <div className="studio-quiz-add">
                                <FaPlusCircle />
                            </div>
                        </>
                    </div>
                </div>
                <div className="form-field">
                    <div className="form-label">Points</div>
                    <Slider
                        value={points}
                        onChange={(_, val) => setPoints(val)}
                        aria-label="Points"
                        defaultValue={50}
                        valueLabelDisplay="auto"
                        shiftStep={15}
                        step={5}
                        marks
                        min={5}
                        max={30}
                    />
                    <div className="form-value-show">{points}pts</div>
                </div>
            </div>
            <div className="studio-quiz-quest">
                <div className="studio-quiz-delete-con">
                    <MdDelete />
                </div>
                <div className="form-field">
                    <div className="form-label">Question Text</div>
                    <textarea
                        className={/*basicForm.formState.errors.bio*/false ? 'form-input-error' : 'form-input-normal'}
                        spellCheck={false}
                        // onKeyUp={() => handleBasicChange('bio')}
                        // {...basicForm.register('bio')}
                    ></textarea>
                    {/* <div className={`form-error ${basicForm.formState.errors.bio ? '' : 'form-hidden'}`}>{basicForm.formState.errors.bio?.message ?? ''}</div> */}
                </div>
                <div className="form-field">
                    <div className="form-label">Answers (Select correct ones)</div>
                    <div className="studio-answer-grid">
                        <>
                            <div className="studio-quiz-answer">
                                <input type="text" className='studio-single-answer form-input-normal' />
                                <Checkbox />
                            </div>
                            <div className="studio-quiz-remove">
                                <FaMinusCircle />
                            </div>
                        </>
                        <>
                            <div className="studio-quiz-answer">
                                <input type="text" className='studio-single-answer form-input-normal' />
                                <Checkbox />
                            </div>
                            <div className="studio-quiz-remove">
                                <FaMinusCircle />
                            </div>
                        </>
                        <>
                            <div className="studio-quiz-empty"></div>
                            <div className="studio-quiz-add">
                                <FaPlusCircle />
                            </div>
                        </>
                    </div>
                </div>
            </div>
            <div className="studio-quiz-quest">
                <div className="studio-quiz-delete-con">
                    <MdDelete />
                </div>
                <div className="form-field">
                    <div className="form-label">Question Text</div>
                    <textarea
                        className={/*basicForm.formState.errors.bio*/false ? 'form-input-error' : 'form-input-normal'}
                        spellCheck={false}
                        // onKeyUp={() => handleBasicChange('bio')}
                        // {...basicForm.register('bio')}
                    ></textarea>
                    {/* <div className={`form-error ${basicForm.formState.errors.bio ? '' : 'form-hidden'}`}>{basicForm.formState.errors.bio?.message ?? ''}</div> */}
                </div>
                <div className="form-field">
                    <div className="form-label">Answers (Write matching pairs)</div>
                    <div className="studio-answer-grid">
                        <>
                            <div className="studio-quiz-answer">
                                <input type="text" className='form-input-normal' />
                                <input type="text" className='form-input-normal' />
                            </div>
                            <div className="studio-quiz-remove">
                                <FaMinusCircle />
                            </div>
                        </>
                        <>
                            <div className="studio-quiz-answer">
                                <input type="text" className='form-input-normal' />
                                <input type="text" className='form-input-normal' />
                            </div>
                            <div className="studio-quiz-remove">
                                <FaMinusCircle />
                            </div>
                        </>
                        <>
                            <div className="studio-quiz-empty"></div>
                            <div className="studio-quiz-add">
                                <FaPlusCircle />
                            </div>
                        </>
                    </div>
                </div>
            </div>
            <div className="studio-quiz-quest">
                <div className="studio-quiz-delete-con">
                    <MdDelete />
                </div>
                <div className="form-field">
                    <div className="form-label">Question Text</div>
                    <textarea
                        className={/*basicForm.formState.errors.bio*/false ? 'form-input-error' : 'form-input-normal'}
                        spellCheck={false}
                        // onKeyUp={() => handleBasicChange('bio')}
                        // {...basicForm.register('bio')}
                    ></textarea>
                    {/* <div className={`form-error ${basicForm.formState.errors.bio ? '' : 'form-hidden'}`}>{basicForm.formState.errors.bio?.message ?? ''}</div> */}
                </div>
                <div className="form-field">
                    <div className="form-label">Answer (Keep it short)</div>
                    <input type="text" className='form-input-normal' />
                </div>
                <div className="form-field studio-points-slider">
                    <div className="form-label">Points</div>
                    <Slider
                        value={points}
                        onChange={(_, val) => setPoints(val)}
                        aria-label="Points"
                        defaultValue={50}
                        valueLabelDisplay="auto"
                        shiftStep={15}
                        step={5}
                        marks
                        min={5}
                        max={30}
                    />
                    <div className="form-value-show">{points}pts</div>
                </div>
            </div>
            <div className="studio-add-quiz">
                <Select
                    className='studio-select-type'
                    value={''}
                    displayEmpty
                    // onChange={e => setSelectedCategory(e.target.value)}
                    IconComponent={() => <FiPlus />}
                    renderValue={selected => {
                        if(selected.length === 0)
                            return 'Add Question';

                        return selected;
                    }}
                    >
                        {questionTypes.map((type, idx) => (<MenuItem key={idx} value={idx}>
                            {type}
                        </MenuItem>))}
                </Select>
            </div>
            <div className="studio-create-buttons">
                <button type="button" className='studio-btn-add'><FaPlus /> Create</button>
                <button type="button" className='studio-btn-save'><IoIosSave /> Save Changes</button>
                <button type="button" className='studio-btn-del'><FaTrashAlt /> Delete</button>
            </div>
        </div>
    )
}

export default CreateQuiz;