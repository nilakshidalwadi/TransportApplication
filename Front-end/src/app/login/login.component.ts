import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { first } from 'rxjs/operators';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  userForm: FormGroup;
  public error: string;
  private returnUrl: string;

  constructor(private formBuilder: FormBuilder,
    private auth: AuthService,
    private route: ActivatedRoute,
    private router: Router) {
    // redirect to home if already logged in
    if (this.auth.currentUserValue) {
      this.router.navigate([this.auth.userRootURL]);
    }
  }

  ngOnInit() {
    this.userForm = this.formBuilder.group({
      'userId': ['', [Validators.required]],
      'password': ['', [Validators.required]]
    });

    // get return url from route parameters or default
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || this.auth.userRootURL;
  }

  login() {
    // stop here if form is invalid
    if (this.userForm.invalid) {
      return;
    }
    this.auth.login(this.userForm.value.userId, this.userForm.value.password).pipe(first())
      .subscribe(
        data => {
          this.router.navigate([this.returnUrl]);
        },
        error => {
          this.error = error;
        });
  }


}
