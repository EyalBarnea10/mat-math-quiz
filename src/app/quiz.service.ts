import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, Subject } from 'rxjs';
import { tap, catchError, switchMap } from 'rxjs/operators';

export interface QuizData {
  gradeLevel: string;
  subject: string;
}

export interface QuizConfig {
  gradeLevel: string;
  subject: string;
  difficulty: string;
  questionCount: number;
  timeLimit: number;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

export interface QuizResponse {
  success: boolean;
  message: string;
  quizQuestions: {
    questions: QuizQuestion[];
  };
  quizData: {
    gradeLevel: string;
    subject: string;
    difficulty: string;
    timeLimit: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class QuizService {
  private readonly API_BASE_URL = 'http://localhost:3001/api';
  
  // Event subjects for different quiz states
  private quizStartedSubject = new BehaviorSubject<QuizConfig | null>(null);
  private quizQuestionsSubject = new BehaviorSubject<QuizResponse | null>(null);
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private errorSubject = new Subject<string>();
  
  // Public observables that components can subscribe to
  public quizStarted$ = this.quizStartedSubject.asObservable();
  public quizQuestions$ = this.quizQuestionsSubject.asObservable();
  public loading$ = this.loadingSubject.asObservable();
  public error$ = this.errorSubject.asObservable();
  
  constructor(private http: HttpClient) {}
  
  // Start a new quiz
  startQuiz(quizData: QuizData): Observable<any> {
    this.loadingSubject.next(true);
    
    return this.http.post(`${this.API_BASE_URL}/quiz/start`, quizData).pipe(
      tap((response: any) => {
        console.log('🎯 Quiz started event:', response);
        this.quizStartedSubject.next(response.quizConfig);
        // Don't set loading to false here - we'll do it after generating questions
      }),
      catchError((error) => {
        console.error('❌ Error starting quiz:', error);
        this.errorSubject.next('Failed to start quiz: ' + error.message);
        this.loadingSubject.next(false);
        throw error;
      })
    );
  }
  
  // Generate quiz questions
  generateQuizQuestions(): Observable<QuizResponse> {
    // Don't set loading to true here - it should already be true from startQuiz
    
    return this.http.post<QuizResponse>(`${this.API_BASE_URL}/quiz/generate`, {}).pipe(
      tap((response) => {
        console.log('🎯 Quiz questions generated event:', response);
        this.quizQuestionsSubject.next(response);
        this.loadingSubject.next(false); // Now we can set loading to false
      }),
      catchError((error) => {
        console.error('❌ Error generating quiz questions:', error);
        this.errorSubject.next('Failed to generate quiz questions: ' + error.message);
        this.loadingSubject.next(false);
        throw error;
      })
    );
  }
  
  // Get current quiz state
  getCurrentQuizState(): QuizConfig | null {
    return this.quizStartedSubject.value;
  }
  
  getCurrentQuizQuestions(): QuizResponse | null {
    return this.quizQuestionsSubject.value;
  }
  
  // Reset quiz state
  resetQuiz(): void {
    this.quizStartedSubject.next(null);
    this.quizQuestionsSubject.next(null);
    this.loadingSubject.next(false);
  }
  
  // Clear error
  clearError(): void {
    this.errorSubject.next('');
  }
  
  // Complete quiz flow - sequential calls
  startQuizAndGenerateQuestions(quizData: QuizData): Observable<QuizResponse> {
    console.log('🚀 Starting complete quiz flow...');
    
    return this.startQuiz(quizData).pipe(
      // After quiz starts successfully, generate questions
      switchMap(() => {
        console.log('✅ Quiz started, now generating questions...');
        return this.generateQuizQuestions();
      }),
      catchError((error) => {
        console.error('❌ Error in complete quiz flow:', error);
        this.loadingSubject.next(false);
        throw error;
      })
    );
  }
} 