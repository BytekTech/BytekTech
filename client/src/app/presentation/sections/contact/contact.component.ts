import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ContactGateway } from '../../../domain/gateways/contact.gateway';
import { LanguageService } from '../../../application/language.service';
import { COMPANY_INFO } from '../../../application/company.token';

type SubmitStatus = 'idle' | 'sending' | 'success' | 'error';
type TextControl = 'name' | 'email' | 'message';

@Component({
  selector: 'app-contact',
  imports: [ReactiveFormsModule],
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContactComponent {
  private readonly language = inject(LanguageService);
  private readonly contactGateway = inject(ContactGateway);
  private readonly formBuilder = inject(NonNullableFormBuilder);

  readonly t = this.language.t;
  readonly company = inject(COMPANY_INFO);
  readonly status = signal<SubmitStatus>('idle');

  readonly form = this.formBuilder.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    company: [''],
    message: ['', Validators.required],
    // Trampa anti-spam: oculta en el template, siempre vacía para una persona.
    website: [''],
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.status.set('sending');
    const { name, email, company, message, website } = this.form.getRawValue();

    this.contactGateway
      .send({ name, email, company: company || undefined, message, website })
      .subscribe({
        next: () => {
          this.status.set('success');
          this.form.reset();
        },
        error: () => this.status.set('error'),
      });
  }

  showError(controlName: TextControl): boolean {
    const control = this.form.controls[controlName];
    return control.invalid && control.touched;
  }

  emailErrorMessage(): string {
    return this.form.controls.email.hasError('required')
      ? this.t().contact.form.requiredError
      : this.t().contact.form.emailError;
  }
}
