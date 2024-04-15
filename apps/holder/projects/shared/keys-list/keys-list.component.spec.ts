import { type ComponentFixture, TestBed } from "@angular/core/testing";

import { KeysListComponent } from "./keys-list.component";

describe("KeysListComponent", () => {
	let component: KeysListComponent;
	let fixture: ComponentFixture<KeysListComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [KeysListComponent],
		}).compileComponents();

		fixture = TestBed.createComponent(KeysListComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it("should create", () => {
		expect(component).toBeTruthy();
	});
});
