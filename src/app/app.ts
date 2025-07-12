import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom, Subscription } from 'rxjs';
import { QuizService, QuizData, QuizConfig, QuizResponse } from './quiz.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ReactiveFormsModule, FormsModule, CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit, OnDestroy {
  public title = 'mat-math-quiz';
  public showForm = false;
  public quizForm: FormGroup | null = null;
  public isLoading = false;
  public quizStarted = false;
  public quizConfig: QuizConfig | null = null;
  public quizQuestions: QuizResponse | null = null;
  public userAnswers: string[] = [];
  public quizSubmitted = false;
  public errorMessage: string = '';
  
  // Subscriptions for event handling
  private subscriptions: Subscription[] = [];
  
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

  constructor(
    private fb: FormBuilder, 
    private http: HttpClient,
    private quizService: QuizService,
    private cdr: ChangeDetectorRef
  ) {
    // Debug logging
    console.log('Constructor - Grade Levels:', this.gradeLevels);
    console.log('Constructor - Grade Levels length:', this.gradeLevels.length);
    console.log('Constructor - First grade level:', this.gradeLevels.length > 0 ? this.gradeLevels[0] : 'No grades available');
    console.log('Constructor - Subjects:', this.subjects);
    console.log('Constructor - Subjects length:', this.subjects.length);
    console.log('Constructor - First subject:', this.subjects.length > 0 ? this.subjects[0] : 'No subjects available');
  }

  ngOnInit() {
    // Initialize form after arrays are ready
    if (this.gradeLevels.length > 0 && this.subjects.length > 0) {
      this.quizForm = this.fb.group({
        gradeLevel: [this.gradeLevels[0], Validators.required],
        subject: [this.subjects[0], Validators.required]
      });
      
      // Debug logging
      console.log('ngOnInit - Grade Levels:', this.gradeLevels);
      console.log('ngOnInit - Subjects:', this.subjects);
      console.log('Form initialized:', this.quizForm);
      console.log('Initial grade level:', this.quizForm.get('gradeLevel')?.value || 'No value');
      console.log('Initial subject:', this.quizForm.get('subject')?.value || 'No value');
    } else {
      console.error('❌ Arrays not ready for form initialization');
    }
    
    // Subscribe to quiz service events
    this.setupEventSubscriptions();
  }
  
  ngOnDestroy() {
    // Clean up subscriptions to prevent memory leaks
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }
  
  private setupEventSubscriptions() {
    // Listen for quiz started events
    const quizStartedSub = this.quizService.quizStarted$.subscribe(
      (config) => {
        console.log('🎯 Received quiz started event:', config);
        this.quizConfig = config;
        this.quizStarted = true;
        console.log('🎯 Updated quizConfig:', this.quizConfig);
        console.log('🎯 Updated quizStarted:', this.quizStarted);
        this.cdr.detectChanges(); // Force change detection
      }
    );
    
    // Listen for quiz questions events
    const quizQuestionsSub = this.quizService.quizQuestions$.subscribe(
      (questions) => {
        console.log('🎯 Received quiz questions event:', questions);
        this.quizQuestions = questions;
        console.log('🎯 Updated quizQuestions:', this.quizQuestions);
        console.log('🎯 quizQuestions.quizQuestions:', this.quizQuestions?.quizQuestions);
        console.log('🎯 quizQuestions.quizQuestions.questions:', this.quizQuestions?.quizQuestions?.questions);
        this.cdr.detectChanges(); // Force change detection
      }
    );
    
    // Listen for loading state changes
    const loadingSub = this.quizService.loading$.subscribe(
      (loading) => {
        console.log('🎯 Loading state changed:', loading);
        this.isLoading = loading;
        this.cdr.detectChanges(); // Force change detection
      }
    );
    
    // Listen for error events
    const errorSub = this.quizService.error$.subscribe(
      (error) => {
        console.log('🎯 Received error event:', error);
        this.errorMessage = error;
        this.cdr.detectChanges(); // Force change detection
      }
    );
    
    // Add all subscriptions to the array for cleanup
    this.subscriptions.push(quizStartedSub, quizQuestionsSub, loadingSub, errorSub);
  }

  public showQuizForm() {
    console.log('showQuizForm called');
    this.showForm = true;
    console.log('showForm set to:', this.showForm);
    console.log('Grade Levels available:', this.gradeLevels);
    console.log('Subjects available:', this.subjects);
  }

  public async startQuiz() {
    if (this.quizForm && this.quizForm.valid) {
      try {
        const quizData: QuizData = this.quizForm.value;
        console.log('🚀 Starting complete quiz flow with:', quizData);
        
        // Use the sequential method that waits for each step
        await firstValueFrom(this.quizService.startQuizAndGenerateQuestions(quizData));
        
        console.log('✅ Complete quiz flow finished successfully');
        console.log('🎯 Final state check:');
        console.log('  - quizStarted:', this.quizStarted);
        console.log('  - quizConfig:', this.quizConfig);
        console.log('  - quizQuestions:', this.quizQuestions);
        console.log('  - isLoading:', this.isLoading);
        
        // Force final change detection
        this.cdr.detectChanges();
        
      } catch (error) {
        console.error('❌ Error in quiz process:', error);
        this.errorMessage = 'Failed to start quiz. Please try again.';
        this.cdr.detectChanges();
      }
    }
  }

  public async generateQuizQuestions() {
    if (!this.quizStarted) {
      console.error('❌ No quiz started');
      return;
    }
    
    try {
      console.log('🎯 Generating quiz questions...');
      await firstValueFrom(this.quizService.generateQuizQuestions());
      console.log('✅ Quiz questions generated successfully');
    } catch (error) {
      console.error('❌ Error generating quiz questions:', error);
      this.errorMessage = 'Failed to generate quiz questions. Please try again.';
    }
  }

  public goBack() {
    this.showForm = false;
    this.quizStarted = false;
    this.quizConfig = null;
    this.quizQuestions = null;
    if (this.quizForm) {
      this.quizForm.reset();
    }
    this.resetQuiz();
    this.quizService.resetQuiz();
    this.errorMessage = '';
  }

  public submitQuiz() {
    this.quizSubmitted = true;
  }

  public isQuizComplete(): boolean {
    const questions = this.getQuestionsArray();
    if (questions.length === 0) {
      return false;
    }
    const questionCount = questions.length;
    return this.userAnswers.length === questionCount && 
           this.userAnswers.every(answer => answer !== undefined && answer !== '');
  }

  public getQuizScore(): number {
    const questions = this.getQuestionsArray();
    if (questions.length === 0) {
      return 0;
    }
    
    let score = 0;
    questions.forEach((question: any, index: number) => {
      const userAnswer = this.userAnswers[index];
      const correctAnswer = question.correctAnswer;
      
      // Extract the option letter from user's answer (e.g., "A. Pushing a ball" -> "A")
      const userOptionLetter = userAnswer ? userAnswer.split('.')[0] : '';
      
      if (userOptionLetter === correctAnswer) {
        score++;
      }
    });
    return score;
  }

  public getQuizPercentage(): number {
    const questions = this.getQuestionsArray();
    if (questions.length === 0) {
      return 0;
    }
    const totalQuestions = questions.length;
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
  
  // Debug method to manually refresh view
  public refreshView() {
    console.log('🔄 Manual refresh triggered');
    console.log('Current state:');
    console.log('  - quizStarted:', this.quizStarted);
    console.log('  - quizConfig:', this.quizConfig);
    console.log('  - quizQuestions:', this.quizQuestions);
    console.log('  - isLoading:', this.isLoading);
    this.cdr.detectChanges();
  }
  
  // Safe method to get questions array
  public getQuestionsArray(): any[] {
    if (!this.quizQuestions) return [];
    
    // Try different possible structures
    if (this.quizQuestions.quizQuestions?.questions) {
      return this.quizQuestions.quizQuestions.questions;
    }
    
    // Check if it has questions property (for different response structures)
    if ((this.quizQuestions as any).questions) {
      return (this.quizQuestions as any).questions;
    }
    
    // If it's directly an array
    if (Array.isArray(this.quizQuestions)) {
      return this.quizQuestions;
    }
    
    return [];
  }
}
