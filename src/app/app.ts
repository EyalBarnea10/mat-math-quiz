import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ReactiveFormsModule, FormsModule, CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  public title = 'mat-math-quiz';
  public showForm = false;
  public quizForm!: FormGroup;
  public isLoading = false;
  public quizStarted = false;
  public quizConfig: any = null;
  public quizQuestions: any = null;
  public userAnswers: string[] = [];
  public quizSubmitted = false;
  
  private readonly API_BASE_URL = 'http://localhost:3001/api';
  
  public gradeLevels: string[] = [
    'Kindergarten',
    '1st Grade',
    '2nd Grade', 
    '3rd Grade',
    '4th Grade',
    '5th Grade',
    '6th Grade',
    '7th Grade',
    '8th Grade',
    '9th Grade',
    '10th Grade',
    '11th Grade',
    '12th Grade'
  ];
  
  public subjects: string[] = [
    'Mathematics',
    'Algebra',
    'Geometry',
    'Trigonometry',
    'Calculus',
    'Statistics',
    'Physics',
    'Chemistry',
    'Biology',
    'Computer Science'
  ];

  constructor(private fb: FormBuilder, private http: HttpClient) {
    // Debug logging
    console.log('Constructor - Grade Levels:', this.gradeLevels);
    console.log('Constructor - Grade Levels length:', this.gradeLevels.length);
    console.log('Constructor - First grade level:', this.gradeLevels[0]);
    console.log('Constructor - Subjects:', this.subjects);
    console.log('Constructor - Subjects length:', this.subjects.length);
    console.log('Constructor - First subject:', this.subjects[0]);
  }

  ngOnInit() {
    // Initialize form after arrays are ready
    this.quizForm = this.fb.group({
      gradeLevel: [this.gradeLevels[0] || '', Validators.required],
      subject: [this.subjects[0] || '', Validators.required]
    });
    
    // Debug logging
    console.log('ngOnInit - Grade Levels:', this.gradeLevels);
    console.log('ngOnInit - Subjects:', this.subjects);
    console.log('Form initialized:', this.quizForm);
    console.log('Initial grade level:', this.quizForm.get('gradeLevel')?.value);
    console.log('Initial subject:', this.quizForm.get('subject')?.value);
  }

  public showQuizForm() {
    console.log('showQuizForm called');
    this.showForm = true;
    console.log('showForm set to:', this.showForm);
    console.log('Grade Levels available:', this.gradeLevels);
    console.log('Subjects available:', this.subjects);
  }

  public async startQuiz() {
    if (this.quizForm.valid) {
      this.isLoading = true;
      
      try {
        const quizData = this.quizForm.value;
        console.log('Starting quiz with:', quizData);
        
        // Step 1: Start the quiz (creates currentQuizData on server)
        const startResponse = await firstValueFrom(
          this.http.post(`${this.API_BASE_URL}/quiz/start`, quizData)
        );
        
        console.log('Quiz started successfully:', startResponse);
        this.quizConfig = startResponse;
        this.quizStarted = true;
        
        // Step 2: Generate quiz questions (uses the currentQuizData from step 1)
        console.log('Generating quiz questions...');
        const generateResponse = await firstValueFrom(
          this.http.post(`${this.API_BASE_URL}/quiz/generate`, {})
        );
        
        console.log('Quiz questions generated:', generateResponse);
        this.quizQuestions = generateResponse as any;
        
      } catch (error) {
        console.error('Error starting quiz:', error);
        // Handle error (show error message to user)
      } finally {
        this.isLoading = false;
      }
    }
  }

  public async generateQuizQuestions() {
    if (!this.quizStarted) {
      console.error('No quiz started');
      return;
    }
    
    this.isLoading = true;
    
    try {
      console.log('Generating quiz questions...');
      
      const response = await firstValueFrom(
        this.http.post(`${this.API_BASE_URL}/quiz/generate`, {})
      );
      
      console.log('Quiz questions generated:', response);
      this.quizQuestions = response as any;
      
      // Quiz questions are already parsed as object from server
      console.log('Quiz questions received:', (response as any).quizQuestions);
      
    } catch (error) {
      console.error('Error generating quiz questions:', error);
    } finally {
      this.isLoading = false;
    }
  }

  public goBack() {
    this.showForm = false;
    this.quizStarted = false;
    this.quizConfig = null;
    this.quizQuestions = null;
    this.quizForm.reset();
    this.resetQuiz();
  }

  public submitQuiz() {
    this.quizSubmitted = true;
  }

  public isQuizComplete(): boolean {
    if (!this.quizQuestions?.quizQuestions?.questions) {
      return false;
    }
    const questionCount = this.quizQuestions.quizQuestions.questions.length;
    return this.userAnswers.length === questionCount && 
           this.userAnswers.every(answer => answer !== undefined && answer !== '');
  }

  public getQuizScore(): number {
    if (!this.quizQuestions?.quizQuestions?.questions) {
      return 0;
    }
    
    let score = 0;
    this.quizQuestions.quizQuestions.questions.forEach((question: any, index: number) => {
      if (this.userAnswers[index] === question.correctAnswer) {
        score++;
      }
    });
    return score;
  }

  public getQuizPercentage(): number {
    if (!this.quizQuestions?.quizQuestions?.questions) {
      return 0;
    }
    const totalQuestions = this.quizQuestions.quizQuestions.questions.length;
    const score = this.getQuizScore();
    return Math.round((score / totalQuestions) * 100);
  }

  public resetQuiz() {
    this.userAnswers = [];
    this.quizSubmitted = false;
  }

  // TrackBy functions for ngFor
  public trackByGrade(index: number, grade: string): string {
    return grade;
  }

  public trackBySubject(index: number, subject: string): string {
    return subject;
  }
}
