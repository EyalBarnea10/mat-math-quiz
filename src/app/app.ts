import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ReactiveFormsModule, CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected title = 'mat-math-quiz';
  protected showForm = false;
  protected quizForm: FormGroup;
  protected isLoading = false;
  protected quizStarted = false;
  protected quizConfig: any = null;
  protected quizQuestions: any = null;
  
  private readonly API_BASE_URL = 'http://localhost:3001/api';
  
  protected gradeLevels = [
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

  protected subjects = [
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
    this.quizForm = this.fb.group({
      gradeLevel: ['', Validators.required],
      subject: ['', Validators.required]
    });
  }

  protected showQuizForm() {
    this.showForm = true;
  }

  protected async startQuiz() {
    if (this.quizForm.valid) {
      this.isLoading = true;
      
      try {
        const quizData = this.quizForm.value;
        console.log('Starting quiz with:', quizData);
        
        const response = await firstValueFrom(
          this.http.post(`${this.API_BASE_URL}/quiz/start`, quizData)
        );
        
        console.log('Quiz started successfully:', response);
        this.quizConfig = response;
        this.quizStarted = true;
        
      } catch (error) {
        console.error('Error starting quiz:', error);
        // Handle error (show error message to user)
      } finally {
        this.isLoading = false;
      }
    }
  }

  protected async generateQuizQuestions() {
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
      
      // Parse the quiz questions if they're in JSON format
      if ((response as any).quizQuestions) {
        try {
          const parsedQuestions = JSON.parse((response as any).quizQuestions);
          console.log('Parsed questions:', parsedQuestions);
          this.quizQuestions.parsedQuestions = parsedQuestions;
        } catch (parseError) {
          console.log('Questions are not in JSON format, using as text:', (response as any).quizQuestions);
        }
      }
      
    } catch (error) {
      console.error('Error generating quiz questions:', error);
    } finally {
      this.isLoading = false;
    }
  }

  protected goBack() {
    this.showForm = false;
    this.quizStarted = false;
    this.quizConfig = null;
    this.quizQuestions = null;
    this.quizForm.reset();
  }
}
