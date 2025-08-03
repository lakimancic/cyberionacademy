
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Rating } from '@mui/material';
import { useNavigate } from 'react-router-dom';

interface CourseData {
  id: number;
  title: string;
  thumbnailUrl: string;
  shortDescription: string;
}

export default function Course({ course }: { course: CourseData }) {
  return (
    <div className="course-card">
      <img src={course.thumbnailUrl} alt={course.title} className="card-img" />
      <div className="overlay">
        <h3>{course.title}</h3>
        <p>{course.shortDescription}</p>
      </div>
    </div>
  );
}