import { Component } from '@angular/core'
import { FormControl, FormGroup } from '@angular/forms'
import { DateService } from '../services/date.service'
import { ApiService } from '../../services/api.service'
import { finalize, Observable, Subscription } from 'rxjs'
import { TableService } from '../services/table.service'

@Component({
	selector: 'app-main-content',
	templateUrl: './main-content.component.html',
	styleUrls: ['./main-content.component.scss']
})
export class MainContentComponent {
	minDate = this.getMinMax().sixMonthAgo
	maxDate = this.getMinMax().today
	mapUniqueOffice: any = new Map()
	range = new FormGroup({
		start: new FormControl<Date | null>(null),
		end: new FormControl<Date | null>(null)
	})
	sub: Subscription[] = []
	isLoading = false

	constructor(private apiService: ApiService, private dateService: DateService) {}
	getMinMax() {
		const today = new Date()
		const sixMonthAgo = new Date(new Date().setMonth(new Date().getMonth() - 6))
		console.log(today, sixMonthAgo)
		return {
			today,
			sixMonthAgo
		}
	}

	getData() {
		this.mapUniqueOffice = new Map()
		const dateStart = this.dateService.getDate(this.range.value.start, this.range.value.end)?.dateStart
		const dateEnd = this.dateService.getDate(this.range.value.start, this.range.value.end)?.dateEnd
		let filterObj$
		if (this.dateService.isCorrectFilterDate(dateStart, dateEnd)) {
			filterObj$ = this.apiService.getDataWithParameter(`dt_date_gte=${dateStart}&dt_date_lte=${dateEnd}`)
		} else {
			filterObj$ = this.apiService.getData1()
		}
		this.makeSub(filterObj$)
	}

	makeSub(observable: Observable<any>) {
		this.sub.push(
			observable
				.pipe(
					finalize(() => {
						this.isLoading = false
					})
				)
				.subscribe((item: any) => {
					item.forEach((elem: any) => {
						if (!this.mapUniqueOffice.has(elem.office_id)) {
							this.mapUniqueOffice.set(elem.office_id, {
								officeId: elem.office_id,
								items: [],
								totalQty: 0
							})
						}
						let uniqueOffice = this.mapUniqueOffice.get(elem.office_id)
						uniqueOffice.totalQty += elem.qty
						uniqueOffice.items.push(elem)
					})
					return item
				})
		)
	}
}
