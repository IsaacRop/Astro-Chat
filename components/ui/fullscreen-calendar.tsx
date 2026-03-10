"use client";

import * as React from "react";
import {
    add,
    eachDayOfInterval,
    endOfMonth,
    endOfWeek,
    format,
    getDay,
    isEqual,
    isSameDay,
    isSameMonth,
    isToday,
    parse,
    startOfToday,
    startOfWeek,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import {
    ChevronLeftIcon,
    ChevronRightIcon,
    PlusCircleIcon,
    CheckSquare,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useMediaQuery } from "@/hooks/use-media-query";

export interface CalendarEvent {
    id: string;
    name: string;
    time?: string;
    datetime: string;
    type: "event" | "task";
    status?: string;
}

export interface CalendarData {
    day: Date;
    events: CalendarEvent[];
}

interface FullScreenCalendarProps {
    data: CalendarData[];
    onAddEvent?: (date: Date) => void;
    onEventClick?: (event: CalendarEvent) => void;
}

const colStartClasses = [
    "",
    "col-start-2",
    "col-start-3",
    "col-start-4",
    "col-start-5",
    "col-start-6",
    "col-start-7",
];

const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export function FullScreenCalendar({
    data,
    onAddEvent,
    onEventClick,
}: FullScreenCalendarProps) {
    const today = startOfToday();
    const [selectedDay, setSelectedDay] = React.useState(today);
    const [currentMonth, setCurrentMonth] = React.useState(
        format(today, "MMM-yyyy")
    );
    const firstDayCurrentMonth = parse(currentMonth, "MMM-yyyy", new Date());
    const isDesktop = useMediaQuery("(min-width: 768px)");

    const days = eachDayOfInterval({
        start: startOfWeek(firstDayCurrentMonth),
        end: endOfWeek(endOfMonth(firstDayCurrentMonth)),
    });

    function previousMonth() {
        const firstDayNextMonth = add(firstDayCurrentMonth, { months: -1 });
        setCurrentMonth(format(firstDayNextMonth, "MMM-yyyy"));
    }

    function nextMonth() {
        const firstDayNextMonth = add(firstDayCurrentMonth, { months: 1 });
        setCurrentMonth(format(firstDayNextMonth, "MMM-yyyy"));
    }

    function goToToday() {
        setCurrentMonth(format(today, "MMM-yyyy"));
        setSelectedDay(today);
    }

    const getEventsForDay = (day: Date) => {
        return data.filter((d) => isSameDay(d.day, day)).flatMap((d) => d.events);
    };

    return (
        <div className="flex flex-1 flex-col h-full bg-background">
            {/* Calendar Header */}
            <div className="flex flex-col space-y-4 p-4 md:flex-row md:items-center md:justify-between md:space-y-0 lg:flex-none border-b border-border">
                <div className="flex flex-auto">
                    <div className="flex items-center gap-6">
                        <div className="hidden w-16 flex-col items-center justify-center rounded-xl border border-border bg-card p-1 md:flex">
                            <h1 className="text-[10px] uppercase text-muted-foreground font-medium tracking-widest">
                                {format(today, "MMM", { locale: ptBR })}
                            </h1>
                            <div className="flex w-full items-center justify-center rounded-lg bg-muted p-1 text-lg font-serif font-medium text-foreground">
                                <span>{format(today, "d")}</span>
                            </div>
                        </div>
                        <div className="flex flex-col">
                            <h2 className="text-2xl font-serif font-medium text-foreground capitalize tracking-tight">
                                {format(firstDayCurrentMonth, "MMMM yyyy", { locale: ptBR })}
                            </h2>
                            <p className="text-sm text-muted-foreground font-sans">
                                {format(firstDayCurrentMonth, "d MMM", { locale: ptBR })} -{" "}
                                {format(endOfMonth(firstDayCurrentMonth), "d MMM yyyy", {
                                    locale: ptBR,
                                })}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col items-center gap-4 md:flex-row md:gap-4">
                    <div className="inline-flex w-full -space-x-px rounded-lg shadow-sm md:w-auto">
                        <Button
                            onClick={previousMonth}
                            className="rounded-none shadow-none first:rounded-l-xl last:rounded-r-xl border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground"
                            variant="outline"
                            size="icon"
                            aria-label="Mês anterior"
                        >
                            <ChevronLeftIcon size={16} strokeWidth={1.5} />
                        </Button>
                        <Button
                            onClick={goToToday}
                            className="w-full rounded-none shadow-none first:rounded-l-xl last:rounded-r-xl border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground md:w-auto px-6 font-sans"
                            variant="outline"
                        >
                            Hoje
                        </Button>
                        <Button
                            onClick={nextMonth}
                            className="rounded-none shadow-none first:rounded-l-xl last:rounded-r-xl border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground"
                            variant="outline"
                            size="icon"
                            aria-label="Próximo mês"
                        >
                            <ChevronRightIcon size={16} strokeWidth={1.5} />
                        </Button>
                    </div>

                    <Separator orientation="vertical" className="hidden h-6 md:block bg-border" />

                    {onAddEvent && (
                        <Button
                            onClick={() => onAddEvent(selectedDay)}
                            className="w-full gap-2 md:w-auto bg-primary text-primary-foreground hover:bg-primary/90 border border-transparent rounded-xl px-4 py-2"
                        >
                            <PlusCircleIcon size={16} strokeWidth={1.5} />
                            <span>Novo Evento</span>
                        </Button>
                    )}
                </div>
            </div>

            {/* Calendar Grid */}
            <div className="flex flex-1 flex-col overflow-hidden bg-background">
                {/* Week Days Header */}
                <div className="grid grid-cols-7 border-b border-border text-center text-[10px] font-medium uppercase tracking-widest leading-6 text-muted-foreground">
                    {weekDays.map((day, idx) => (
                        <div
                            key={day}
                            className={cn("py-3", idx < 6 && "border-r border-border")}
                        >
                            {day}
                        </div>
                    ))}
                </div>

                {/* Calendar Days */}
                <div className="flex flex-1 text-xs leading-6 overflow-auto">
                    {/* Desktop Grid */}
                    <div className="hidden w-full md:grid md:grid-cols-7 md:auto-rows-fr border-l border-border">
                        {days.map((day, dayIdx) => {
                            const dayEvents = getEventsForDay(day);
                            const isSelected = isEqual(day, selectedDay);
                            const isCurrentMonth = isSameMonth(day, firstDayCurrentMonth);

                            return (
                                <div
                                    key={dayIdx}
                                    onClick={() => setSelectedDay(day)}
                                    className={cn(
                                        dayIdx === 0 && colStartClasses[getDay(day)],
                                        !isCurrentMonth && "bg-background text-muted-foreground",
                                        "relative flex flex-col border-b border-r border-border cursor-pointer transition-colors min-h-[60px] md:min-h-[100px]",
                                        !isSelected && isCurrentMonth && "hover:bg-muted",
                                        isSelected && "bg-card"
                                    )}
                                >
                                    <header className="flex items-center justify-between p-3">
                                        <button
                                            type="button"
                                            className={cn(
                                                "flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium transition-all font-serif",
                                                isToday(day) &&
                                                "bg-primary text-primary-foreground shadow-sm",
                                                isSelected &&
                                                !isToday(day) &&
                                                "bg-foreground text-background",
                                                !isSelected &&
                                                !isToday(day) &&
                                                "text-foreground/70 group-hover:text-foreground"
                                            )}
                                        >
                                            <time dateTime={format(day, "yyyy-MM-dd")}>
                                                {format(day, "d")}
                                            </time>
                                        </button>
                                    </header>

                                    {/* Events */}
                                    <div className="flex-1 px-2 pb-2 space-y-1.5 overflow-hidden">
                                        {dayEvents.slice(0, 3).map((event) => (
                                            <div
                                                key={event.id}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onEventClick?.(event);
                                                }}
                                                className={cn(
                                                    "flex items-center gap-1.5 rounded-md px-2 py-1.5 text-[10px] leading-tight truncate cursor-pointer transition-all border",
                                                    event.type === "task"
                                                        ? "bg-emerald-500/5 text-emerald-400 border-emerald-500/10 hover:bg-emerald-500/10 hover:border-emerald-500/20"
                                                        : "bg-blue-500/5 text-blue-400 border-blue-500/10 hover:bg-blue-500/10 hover:border-blue-500/20"
                                                )}
                                            >
                                                {event.type === "task" && (
                                                    <CheckSquare size={10} className="flex-shrink-0 opacity-70" strokeWidth={1.5} />
                                                )}
                                                <span className="truncate font-medium font-sans opacity-90">
                                                    {event.name}
                                                </span>
                                            </div>
                                        ))}
                                        {dayEvents.length > 3 && (
                                            <div className="text-[10px] text-muted-foreground pl-2 font-medium">
                                                + {dayEvents.length - 3} mais
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Mobile Grid */}
                    <div className="grid w-full grid-cols-7 auto-rows-fr border-l border-border md:hidden bg-background">
                        {days.map((day, dayIdx) => {
                            const dayEvents = getEventsForDay(day);
                            const isSelected = isEqual(day, selectedDay);
                            const isCurrentMonth = isSameMonth(day, firstDayCurrentMonth);

                            return (
                                <button
                                    onClick={() => setSelectedDay(day)}
                                    key={dayIdx}
                                    type="button"
                                    className={cn(
                                        !isCurrentMonth && "text-muted-foreground bg-muted/50",
                                        "flex min-h-[60px] flex-col items-center border-b border-r border-border px-1 py-1.5 focus:z-10 relative",
                                        isSelected && "bg-card"
                                    )}
                                >
                                    <time
                                        dateTime={format(day, "yyyy-MM-dd")}
                                        className={cn(
                                            "flex h-6 w-6 items-center justify-center rounded-full text-xs font-serif transition-colors",
                                            isToday(day) && "bg-primary text-primary-foreground font-medium",
                                            isSelected && !isToday(day) && "bg-foreground text-background",
                                            !isToday(day) && !isSelected && "text-muted-foreground"
                                        )}
                                    >
                                        {format(day, "d")}
                                    </time>

                                    <div className="mt-auto flex flex-wrap justify-center gap-1 w-full px-1">
                                        {dayEvents.slice(0, 3).map((event) => (
                                            <span
                                                key={event.id}
                                                className={cn(
                                                    "h-1 w-1 rounded-full",
                                                    event.type === "task"
                                                        ? "bg-emerald-500"
                                                        : "bg-blue-500"
                                                )}
                                            />
                                        ))}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Selected Day Details (Mobile) */}
                <div className="md:hidden border-t border-border p-5 bg-card">
                    <h3 className="font-serif text-lg text-foreground mb-4 capitalize font-medium">
                        {format(selectedDay, "EEEE, d 'de' MMMM", { locale: ptBR })}
                    </h3>
                    <div className="space-y-3">
                        {getEventsForDay(selectedDay).length === 0 ? (
                            <p className="text-sm text-muted-foreground font-sans italic">
                                Nenhum evento para este dia
                            </p>
                        ) : (
                            getEventsForDay(selectedDay).map((event) => (
                                <div
                                    key={event.id}
                                    onClick={() => onEventClick?.(event)}
                                    className={cn(
                                        "flex items-center gap-3 rounded-xl px-4 py-3 text-sm cursor-pointer border transition-colors",
                                        event.type === "task"
                                            ? "bg-emerald-500/5 text-emerald-400 border-emerald-500/10"
                                            : "bg-blue-500/5 text-blue-400 border-blue-500/10"
                                    )}
                                >
                                    {event.type === "task" && (
                                        <CheckSquare size={16} className="opacity-80" strokeWidth={1.5} />
                                    )}
                                    <div className="flex-1">
                                        <p className="font-medium font-sans text-foreground">{event.name}</p>
                                        {event.time && (
                                            <p className="text-xs text-muted-foreground mt-0.5">
                                                {event.time}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default FullScreenCalendar;
